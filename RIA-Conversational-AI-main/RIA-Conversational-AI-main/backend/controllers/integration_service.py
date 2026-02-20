import requests
import json
import re

from controllers.llm_service import oai


def generate_structured_request(query, agent_cfg, memory=None):
    """
    Sends the user query along with agent-specific configuration to GPT-4o-mini to recognize intent.
    Returns the structured request as a dictionary.
    
    Args:
        query: User's query string
        agent_cfg: Agent configuration dictionary
        memory: Optional list of conversation history [{"role": "user", "text": "..."}, ...]
    """
    # Extract agent configuration details
    endpoint = agent_cfg.get("endpoint", "")
    method = agent_cfg.get("method", "GET")
    required_fields = agent_cfg.get("required_fields", [])
    optional_fields = agent_cfg.get("optional_fields", [])
    query_field = agent_cfg.get("query_field", "query")
    use_query_params = agent_cfg.get("use_query_params", False)
    response_fields = agent_cfg.get("response_field", [])
    headers = agent_cfg.get("headers", {})
    
    # Extract memory configuration
    memory_cfg = agent_cfg.get("memory", {})
    memory_enabled = memory_cfg.get("enabled", False)
    memory_delivery = memory_cfg.get("delivery", "body")
    memory_field_name = memory_cfg.get("field_name", "conversation_history")
    memory_send_as = memory_cfg.get("send_as", "json")
    memory_item_template = memory_cfg.get("item_template", {})
    
    # Determine where to place the data (query_params or body)
    data_location = "query_params" if use_query_params else "body"
    
    # Create a template for the expected output
    output_template = {
        "url": endpoint,
        "method": method,
        "headers": headers,
        data_location: {
            query_field: "<USER_QUERY_HERE>"
        },
        "response_format": "json",
        "response_fields": response_fields
    }
    
    # Add memory to template if enabled and memory exists
    memory_instructions = ""
    if memory_enabled and memory and len(memory) > 0:
        # Transform memory according to item_template
        transformed_memory = transform_memory(memory, memory_item_template)
        
        # Add memory to the appropriate location
        if memory_delivery == "body":
            output_template["body"][memory_field_name] = transformed_memory
        elif memory_delivery == "query_params":
            output_template["query_params"][memory_field_name] = transformed_memory
        
        memory_instructions = f'''
- Memory is ENABLED for this agent
- Include conversation history in "{memory_field_name}" field
- Place memory in "{memory_delivery}" section
- Memory format: {json.dumps(transformed_memory[:1], indent=2)} (example)
'''
    
    # Construct a very explicit prompt for GPT-4o-mini
    prompt = f'''Extract information from the user query and build an API request.

USER QUERY: "{query}"

AGENT CONFIGURATION:
- Endpoint (DO NOT CHANGE): {endpoint}
- Method (DO NOT CHANGE): {method}
- Query Field Name: {query_field}
- Data Location: {data_location}
- Required Fields: {required_fields}
- Optional Fields: {optional_fields}
{memory_instructions}

TASK:
1. Take the user's query text: "{query}"
2. Place it in the "{query_field}" field
3. Extract any additional parameters if mentioned in the query that match optional fields: {optional_fields}
4. {"Include conversation history if memory is enabled" if memory_enabled and memory else ""}
5. Use the EXACT template below

OUTPUT TEMPLATE (fill in the {query_field} value):
{json.dumps(output_template, indent=2)}

RULES:
- Return ONLY valid JSON
- Use the exact endpoint: {endpoint}
- Use the exact method: {method}
- NO explanations or markdown
- NO ``` code blocks
- Map user query to "{query_field}" field
- Place data in "{data_location}" section
{"- Include memory in " + memory_field_name + " if provided" if memory_enabled and memory else ""}

Return the JSON now:'''

    try:
        # Send the prompt to OpenAI's GPT-4o-mini
        response = oai().chat.completions.create(
            model="gpt-4o-mini",  # Explicitly use gpt-4o-mini
            messages=[
                {
                    "role": "system", 
                    "content": "You are a JSON generator. Return only valid JSON with no additional text, explanations, or formatting."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            max_tokens=1000,
            temperature=0,  # Deterministic output
            response_format={"type": "json_object"}  # Force JSON mode 
        )
        
        # Extract the response content
        response_content = (response.choices[0].message.content or "").strip()
        
        # Clean up any potential markdown formatting 
        response_content = clean_json_response(response_content)
        
        # Parse the JSON
        structured_request = json.loads(response_content)
        
        # Post-processing: Force correct endpoint and method
        structured_request["url"] = endpoint
        structured_request["method"] = method
        structured_request["headers"] = headers if headers else {}
        structured_request["response_format"] = "json"
        structured_request["response_fields"] = response_fields
        
        # Ensure the data is in the correct location
        if data_location not in structured_request:
            structured_request[data_location] = {}
        
        # Ensure query field exists
        if query_field not in structured_request.get(data_location, {}):
            structured_request[data_location][query_field] = query
        
        # Handle memory injection
        if memory_enabled and memory and len(memory) > 0:
            transformed_memory = transform_memory(memory, memory_item_template)
            target_location = structured_request.get(memory_delivery, {})
            
            # Ensure the delivery location exists
            if memory_delivery not in structured_request:
                structured_request[memory_delivery] = {}
            
            structured_request[memory_delivery][memory_field_name] = transformed_memory
        
        # Remove any hallucinated fields that aren't in the data location
        other_location = "body" if data_location == "query_params" else "query_params"
        if other_location in structured_request and not structured_request[other_location]:
            del structured_request[other_location]
        
        return structured_request
        
    except json.JSONDecodeError as e:
        # Fallback: Extract JSON using regex
        response_content_cleaned = clean_json_response(response_content)
        json_match = re.search(r'\{.*\}', response_content_cleaned, re.DOTALL)
        
        if json_match:
            try:
                structured_request = json.loads(json_match.group())
                # Apply same post-processing
                structured_request["url"] = endpoint
                structured_request["method"] = method
                return structured_request
            except json.JSONDecodeError:
                pass
        
        # Last resort: Build request manually
        return build_fallback_request(query, agent_cfg, memory)
    
    except Exception as e:
        # If all else fails, build a basic request
        return build_fallback_request(query, agent_cfg, memory)


def transform_memory(memory, item_template):
    """
    Transform memory items according to the item_template.
    Supports any field mapping and can include static text or multiple placeholders.
    
    Args:
        memory: List of conversation items [{"role": "user", "text": "..."}, ...]
        item_template: Template dict that can include:
            - Direct mappings: {"role": "{role}", "content": "{text}"}
            - Static text: {"type": "message", "role": "{role}"}
            - Combined text: {"message": "{role}: {text}"}
            - Nested structures: {"data": {"speaker": "{role}", "msg": "{text}"}}
    
    Returns:
        Transformed memory list
    
    Examples:
        # Input memory:
        [{"role": "user", "text": "Hello"}]
        
        # Template 1: {"role": "{role}", "content": "{text}"}
        # Output: [{"role": "user", "content": "Hello"}]
        
        # Template 2: {"speaker": "{role}", "message": "{text}", "type": "chat"}
        # Output: [{"speaker": "user", "message": "Hello", "type": "chat"}]
        
        # Template 3: {"msg": "{role} said: {text}"}
        # Output: [{"msg": "user said: Hello"}]
    """
    if not item_template:
        return memory
    
    transformed = []
    for item in memory:
        new_item = transform_item(item, item_template)
        transformed.append(new_item)
    
    return transformed


def transform_item(item, template):
    """
    Recursively transform a single item according to template.
    Handles nested dictionaries and lists.
    """
    if isinstance(template, dict):
        result = {}
        for key, template_value in template.items():
            result[key] = transform_item(item, template_value)
        return result
    elif isinstance(template, list):
        return [transform_item(item, t) for t in template]
    elif isinstance(template, str):
        # Replace all placeholders in the string
        value = template
        for mem_key, mem_value in item.items():
            placeholder = f"{{{mem_key}}}"
            if placeholder in value:
                value = value.replace(placeholder, str(mem_value))
        return value
    else:
        # Return as-is for other types (int, bool, etc.)
        return template


def clean_json_response(response_content):
    """Remove markdown formatting and extra text from LLM response."""
    # Remove markdown code blocks
    response_content = re.sub(r'```json\s*', '', response_content)
    response_content = re.sub(r'```\s*', '', response_content)
    
    # Remove any text before the first {
    first_brace = response_content.find('{')
    if first_brace > 0:
        response_content = response_content[first_brace:]
    
    # Remove any text after the last }
    last_brace = response_content.rfind('}')
    if last_brace > 0:
        response_content = response_content[:last_brace + 1]
    
    return response_content.strip()


def build_fallback_request(query, agent_cfg, memory=None):
    """Build a basic request when LLM fails."""
    endpoint = agent_cfg.get("endpoint", "")
    method = agent_cfg.get("method", "GET")
    query_field = agent_cfg.get("query_field", "query")
    response_fields = agent_cfg.get("response_field", [])
    headers = agent_cfg.get("headers", {})
    
    # Extract memory configuration
    memory_cfg = agent_cfg.get("memory", {})
    memory_enabled = memory_cfg.get("enabled", False)
    memory_delivery = memory_cfg.get("delivery", "body")
    memory_field_name = memory_cfg.get("field_name", "conversation_history")
    memory_item_template = memory_cfg.get("item_template", {})

    data_location = "query_params" if agent_cfg.get("use_query_params", False) else "body"
    
    request = {
        "url": endpoint,
        "method": method,
        "headers": headers,
        data_location: {
            query_field: query
        },
        "response_format": "json",
        "response_fields": response_fields
    }
    
    # Add memory if enabled
    if memory_enabled and memory and len(memory) > 0:
        transformed_memory = transform_memory(memory, memory_item_template)
        
        # Ensure the delivery location exists
        if memory_delivery not in request:
            request[memory_delivery] = {}
        
        request[memory_delivery][memory_field_name] = transformed_memory
    
    return request


def send_api_request(api_request, agent_cfg):
    """
    Send the actual API request based on the structured data (headers, query parameters, body).
    Process the response based on response_fields and response_format from the agent configuration.
    """
    # Extract method, URL, headers, query params, and body from the structured request
    method = api_request["method"].upper()
    url = api_request["url"]
    headers = api_request.get("headers", {})
    query_params = api_request.get("query_params", {})
    body = api_request.get("body", {})

    # Send the request
    if method == "GET":
        response = requests.get(url, headers=headers, params=query_params)
    elif method == "POST":
        print("Request sent to agent")
        response = requests.post(url, headers=headers, json=body)
    else:
        raise ValueError(f"Unsupported HTTP method: {method}")

    # Check if the request was successful
    if response.status_code == 200:
        # Get the response JSON
        response_data = response.json()

        # Process the response based on response_fields configuration
        response_fields = agent_cfg.get("response_field", [])

        # Filter the response based on the specified response fields
        filtered_response = {field: response_data.get(field) for field in response_fields if field in response_data}

        optional_response_fields = agent_cfg.get("optional_response_field", [])
        optional_response_field_type = agent_cfg.get("optional_response_field_type", [])

        optional_response = [
            {
                "value": response_data.get(field),
                "type": optional_response_field_type[i]
            }
            for i, field in enumerate(optional_response_fields)
            if field in response_data
        ]

        # Return the filtered response
        print("filtered_response:", filtered_response)
        print("optional_response:", optional_response)
        return filtered_response, optional_response
    else:
        response.raise_for_status()


def get_agent_config(agent_name = None):
    """
    Load micro-agent configurations from the database.
    
    Args:
        agent_name: Optional agent name to fetch a specific agent.
                   If None, returns all agents.
    
    Returns:
        Dictionary of agent configurations or a single agent config.
    """
    from controllers.config_setup_service import AgentConfigDB
    
    try:
        db = AgentConfigDB(schema="agent_config")
        
        if agent_name:
            # Get specific agent
            agent = db.get_agent(agent_name)
            if not agent:
                print(f"Agent '{agent_name}' not found in database")
                return None
            
            # Transform database format back to original config format
            return transform_db_to_config(agent)
        else:
            # Get all agents
            agents = db.get_all_agents()
            
            # Transform to original config format: {"agent_name": {...}, ...}
            config_dict = {}
            for agent in agents:
                agent_name_key = agent.get("agent_name")
                if agent_name_key:
                    config_dict[agent_name_key] = transform_db_to_config(agent)
            
            return config_dict
            
    except Exception as e:
        print(f"Error loading agent config from database: {e}")
        return {} if not agent_name else None


def transform_db_to_config(agent):
    """
    Transform database row format to original config format.
    
    Args:
        agent: Agent data from database
    
    Returns:
        Transformed agent configuration
    """
    config = {
        "description": agent.get("description", ""),
        "endpoint": agent.get("endpoint", ""),
        "method": agent.get("method", "GET"),
        "query_params": agent.get("query_params", []),
        "required_fields": agent.get("required_fields", []),
        "response_format": agent.get("response_format", "json"),
        "response_field": agent.get("response_field", []),
        "optional_response_field": agent.get("optional_response_field", []),
        "optional_response_field_type": agent.get("optional_response_field_type", []),
    }
    
    # Add memory config if enabled
    if agent.get("memory_enabled"):
        config["memory"] = {
            "enabled": agent.get("memory_enabled", False),
            "delivery": agent.get("memory_delivery", "body"),
            "field_name": agent.get("memory_field_name", ""),
            "send_as": agent.get("memory_send_as", "json"),
            "item_template": agent.get("item_template", {})
        }
    
    return config