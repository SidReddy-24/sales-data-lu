"""
Natural Language Processing Engine
"""
import json
from typing import Dict, Any, Optional
from enum import Enum

class CommandType(Enum):
    GREETING = "greeting"
    SYSTEM_INFO = "system_info"
    FILE_OPERATION = "file_operation"
    CONTROL = "control"
    QUERY = "query"
    UNKNOWN = "unknown"

class NLPEngine:
    def __init__(self):
        self.commands = {
            "greeting": ["hello", "hi", "hey jarvis", "good morning", "good evening"],
            "system_info": ["what is my", "tell me", "show me", "get", "system"],
            "file_operation": ["open", "read", "write", "delete", "file"],
            "control": ["shutdown", "restart", "sleep", "lock"],
            "query": ["how", "what", "why", "when", "where"],
        }
    
    def analyze(self, text: str) -> Dict[str, Any]:
        """Analyze user input and extract intent"""
        text = text.lower().strip()
        
        intent = self._detect_intent(text)
        entities = self._extract_entities(text)
        
        return {
            "text": text,
            "intent": intent,
            "entities": entities,
            "confidence": self._calculate_confidence(text, intent),
        }
    
    def _detect_intent(self, text: str) -> CommandType:
        """Detect the intent of the user input"""
        for intent_type, keywords in self.commands.items():
            if any(keyword in text for keyword in keywords):
                # Defensive mapping: enum lookup might fail if keys aren't aligned with enum names
                try:
                    return CommandType[intent_type.upper()]
                except KeyError:
                    # Map known mismatches explicitly (backwards compatibility)
                    if intent_type in ("file", "file_operation"):
                        return CommandType.FILE_OPERATION
                    return CommandType.UNKNOWN
        return CommandType.UNKNOWN
    
    def _extract_entities(self, text: str) -> list:
        """Extract entities from text"""
        # Simple entity extraction
        entities = []
        words = text.split()
        # Can be extended with NER models
        return entities
    
    def _calculate_confidence(self, text: str, intent: CommandType) -> float:
        """Calculate confidence score"""
        if intent == CommandType.UNKNOWN:
            return 0.3
        return 0.85  # Default confidence
