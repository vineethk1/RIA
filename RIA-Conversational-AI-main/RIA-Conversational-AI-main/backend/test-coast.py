import base64
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import uvicorn
import os
from openai import OpenAI
from config import settings

app = FastAPI(
    title="Manufacturing Chat API",
    description="API for manufacturing-related queries",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=settings.OPENAI_API_KEY)

# System prompt for manufacturing context
SYSTEM_PROMPT = """You are an expert manufacturing assistant with deep knowledge in:
- Production metrics and KPIs
- Inventory management
- Quality control and assurance
- Equipment maintenance and status
- Workforce management
- Supply chain operations
- Lean manufacturing principles
- Safety protocols

Provide clear, accurate, and actionable responses to manufacturing-related queries.
Use data-driven insights when discussing metrics and always prioritize safety and efficiency."""


# Request Models
class ChatRequest(BaseModel):
    query: str = Field(..., description="The user's query", min_length=1)
    conversation_history: List[Dict[str, str]] = Field(
        default_factory=list,
        description="Previous conversation messages"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "query": "What are the production metrics for last month?",
                "conversation_history": [
                    {"role": "user", "content": "Hi"},
                    {"role": "assistant", "content": "Hello! How can I help?"}
                ]
            }
        }


# Response Models
class ChatResponse(BaseModel):
    response: str
    status: str = "success"
    conversation_id: Optional[str] = None
    image: Optional[str] = None
    video: Optional[str] = None
    html: Optional[str] = None


def image_to_base64(image_path: str) -> str:
    with open(image_path, "rb") as img_file:
        return base64.b64encode(img_file.read()).decode("utf-8")

def get_llm_response(query: str, conversation_history: List[Dict[str, str]]) -> str:
    """
    Get response from GPT-4o-mini with conversation history as context.
    
    Args:
        query: The user's current query
        conversation_history: List of previous messages in the conversation
        
    Returns:
        The LLM's response as a string
    """
    try:
        # Build messages array starting with system prompt

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # Add conversation history
        for msg in conversation_history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ["user", "assistant"] and content:
                messages.append({"role": role, "content": content})
        
        # Add current query
        messages.append({"role": "user", "content": query})

        print(f"Messages sent to LLM: {messages}")
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
            max_tokens=1000,
            top_p=0.9,
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        print(f"Error calling OpenAI API: {str(e)}")
        raise


# Root endpoint
@app.get("/")
def read_root():
    return {
        "message": "Manufacturing Chat API",
        "version": "1.0.0",
        "endpoints": {
            "manufacturing_chat": "/chat/manufacturing",
            "health": "/health"
        }
    }


# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "manufacturing-chat"}


# Manufacturing chat endpoint
@app.post("/chat/manufacturing", response_model=ChatResponse)
def manufacturing_chat(request: ChatRequest):
    """
    Handle manufacturing-related queries using GPT-4o-mini.
    
    This endpoint processes queries about manufacturing, production metrics,
    inventory, quality control, etc., with full conversation history context.
    """
    try:
        query = request.query
        conversation_history = request.conversation_history
        
        print(f"\n{'='*50}")
        print(f"Received query: {query}")
        print(f"Conversation history length: {len(conversation_history)}")
        print(f"Conversation history: {conversation_history}")
        print(f"{'='*50}\n")
        
        # Get response from LLM with conversation history
        response_text = get_llm_response(query, conversation_history)
        
        print(f"LLM Response: {response_text}\n")

        image_base64 = image_to_base64("bar-charts-4.jpeg")
        video_url = "https://www.w3schools.com/html/mov_bbb.mp4"
        html_text = f"""
        <div>
            <h3>Manufacturing Data Visualization</h3>
            <img src="data:image/jpeg;base64,{image_base64}" alt="Manufacturing Chart" style="width:400px;"/>
            <br/> <br/>
            <video width="150px" controls>
                <source src="{video_url}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        </div>
        """

        return ChatResponse(
            response=response_text,
            html=html_text,
            status="success"
        )
        
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing query: {str(e)}"
        )


# Additional endpoint for testing internal routing
@app.post("/chat/manufacturing/direct")
def manufacturing_chat_direct(query: str):
    """
    Simplified endpoint that accepts just a query string.
    Useful for direct function calls from internal routing.
    """
    try:
        request = ChatRequest(query=query)
        response = manufacturing_chat(request)
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error: {str(e)}"
        )


# Error handlers
@app.exception_handler(404)
def not_found_handler(request, exc):
    return {
        "error": "Endpoint not found",
        "path": str(request.url),
        "available_endpoints": ["/", "/health", "/chat/manufacturing"]
    }


@app.exception_handler(500)
def internal_error_handler(request, exc):
    return {
        "error": "Internal server error",
        "details": str(exc)
    }


if __name__ == "__main__":
    # Check for OpenAI API key
    if not os.getenv("OPENAI_API_KEY"):
        print("WARNING: OPENAI_API_KEY environment variable not set!")
        print("Please set it with: export OPENAI_API_KEY='your-api-key'")
    
    # Run the server
    print("Starting Manufacturing Chat API server...")
    print("API docs available at: http://localhost:8000/docs")
    print("Alternative docs at: http://localhost:8000/redoc")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8080,
        reload=True,  
        log_level="info"
    )