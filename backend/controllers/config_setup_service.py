import os
from supabase import create_client, Client
from typing import Optional, Dict, Any, List

from config import settings

class AgentConfigDB:
    """Class to manage agent configuration in Supabase"""
    
    def __init__(self, schema: str = "public"):
        """Initialize Supabase client"""
        supabase_url = settings.SUPABASE_URL
        supabase_key = settings.SUPABASE_KEY
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")
        
        self.client: Client = create_client(supabase_url, supabase_key)
        self.table_name = "agents"
        self.schema = schema
    
    def get_agent(self, agent_name: str) -> Optional[Dict[str, Any]]:
        """Get a single agent by name"""
        try:
            response = (
                self.client.schema(self.schema)
                .table(self.table_name)
                .select("*")
                .eq("agent_name", agent_name)
                .execute()
            )
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error fetching agent: {e}")
            return None
    
    def get_all_agents(self) -> List[Dict[str, Any]]:
        """Get all agents"""
        try:
            response = (
                self.client.schema(self.schema)
                .table(self.table_name)
                .select("*")
                .execute()
            )
            return response.data
        except Exception as e:
            print(f"Error fetching agents: {e}")
            return []
    
    def create_agent(self, agent_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new agent configuration"""
        try:
            response = (
                self.client.schema(self.schema)
                .table(self.table_name)
                .insert(agent_data)
                .execute()
            )
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error creating agent: {e}")
            return None
    
    def update_agent(self, agent_name: str, agent_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an existing agent configuration"""
        try:
            response = (
                self.client.schema(self.schema)
                .table(self.table_name)
                .update(agent_data)
                .eq("agent_name", agent_name)
                .execute()
            )
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error updating agent: {e}")
            return None
    
    def delete_agent(self, agent_name: str) -> bool:
        """Delete an agent configuration"""
        try:
            self.client.schema(self.schema).table(self.table_name).delete().eq("agent_name", agent_name).execute()
            return True
        except Exception as e:
            print(f"Error deleting agent: {e}")
            return False
    
    def get_agents_with_memory(self) -> List[Dict[str, Any]]:
        """Get all agents with memory enabled"""
        try:
            response = (
                self.client.schema(self.schema)
                .table(self.table_name)
                .select("*")
                .eq("memory_enabled", True)
                .execute()
            )
            return response.data
        except Exception as e:
            print(f"Error fetching agents with memory: {e}")
            return []