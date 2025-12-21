"""
Main JARVIS AI Core - Orchestrates all components
Updated: fallback to text mode when microphone backend is unavailable
"""
import logging
from typing import Optional, Callable
from config.config import AI_NAME, VOICE_SETTINGS, FLASH_DRIVE_PATH
from core.voice_engine import VoiceEngine
from core.nlp_engine import NLPEngine, CommandType
from core.system_access import SystemAccess
from datetime import datetime
import json

class JARVIS:
    def __init__(self):
        self.name = AI_NAME
        self.voice_engine = VoiceEngine(
            rate=VOICE_SETTINGS['rate'],
            volume=VOICE_SETTINGS['volume']
        )
        self.nlp_engine = NLPEngine()
        self.system_access = SystemAccess()
        self.running = False
        self.setup_logging()
    
    def setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(self.name)
    
    def start(self):
        """Start JARVIS"""
        self.running = True
        self.voice_engine.speak(f"Hello sir. {self.name} online. Ready to assist.")
        self.logger.info(f"{self.name} started successfully")
        self.main_loop()
    
    def main_loop(self):
        """Main conversation loop"""
        # If there's no audio backend, switch to text mode
        if not self.voice_engine.audio_backend:
            self.voice_engine.speak("Voice input not available. Switching to text mode. Type your commands.")
            print("Voice input not available — entering text mode. Type 'exit' to quit.")
            # Provide actionable, platform-specific install instructions to enable voice
            try:
                help_text = self.voice_engine.get_install_instructions()
                print('\n=== How to enable voice input ===\n')
                print(help_text)
            except Exception as e:
                self.logger.debug(f"Could not generate audio install instructions: {e}")
            while self.running:
                try:
                    user_input = input("You: ")
                except (EOFError, KeyboardInterrupt):
                    self.stop()
                    break

                if not user_input:
                    continue
                if user_input.strip().lower() in ("exit", "quit", "shutdown", "power down"):
                    self.stop()
                    break

                self.logger.info(f"User (text): {user_input}")
                response = self.process_command(user_input)
                self.voice_engine.speak(response)
                self.save_interaction(user_input, response)

            return

        # Normal voice mode
        while self.running:
            user_input = self.voice_engine.listen(timeout=30)
            
            if user_input:
                self.logger.info(f"User: {user_input}")
                response = self.process_command(user_input)
                self.voice_engine.speak(response)
                self.save_interaction(user_input, response)
    
    def process_command(self, user_input: str) -> str:
        """Process user input and generate response"""
        analysis = self.nlp_engine.analyze(user_input)
        intent = analysis['intent']
        
        if intent == CommandType.GREETING:
            return self.handle_greeting()
        elif intent == CommandType.SYSTEM_INFO:
            return self.handle_system_info(user_input)
        elif intent == CommandType.FILE_OPERATION:
            return self.handle_file_operation(user_input)
        elif intent == CommandType.CONTROL:
            return self.handle_control(user_input)
        elif intent == CommandType.QUERY:
            return self.handle_query(user_input)
        else:
            return "I did not understand that. Could you please repeat?"
    
    def handle_greeting(self) -> str:
        """Handle greeting commands"""
        return "Good to see you. How can I assist you today?"
    
    def handle_system_info(self, user_input: str) -> str:
        """Handle system information requests"""
        system_info = self.system_access.get_system_info()
        
        if "cpu" in user_input or "processor" in user_input:
            return f"Your CPU usage is at {system_info['cpu_percent']} percent"
        elif "memory" in user_input or "ram" in user_input:
            return f"Memory available: {system_info['memory']['available']}"
        elif "disk" in user_input:
            return f"Disk space free: {system_info['disk']['free']}"
        else:
            return f"System is running on {system_info['platform']} with {system_info['cpu_count']} processors"
    
    def handle_file_operation(self, user_input: str) -> str:
        """Handle file operations"""
        return "File operation feature coming soon"
    
    def handle_control(self, user_input: str) -> str:
        """Handle system control commands"""
        if "shutdown" in user_input:
            return "Shutdown command received"
        elif "restart" in user_input:
            return "Restart command received"
        return "Control command not recognized"
    
    def handle_query(self, user_input: str) -> str:
        """Handle general queries"""
        return "I will search for that information for you"
    
    def save_interaction(self, user_input: str, response: str):
        """Save conversation to flash drive"""
        try:
            interaction = {
                "timestamp": datetime.now().isoformat(),
                "user_input": user_input,
                "response": response,
            }
            
            log_file = FLASH_DRIVE_PATH / "conversations.json"
            conversations = []
            
            if log_file.exists():
                with open(log_file, 'r') as f:
                    conversations = json.load(f)
            
            conversations.append(interaction)
            
            with open(log_file, 'w') as f:
                json.dump(conversations, f, indent=2)
        except Exception as e:
            self.logger.error(f"Error saving interaction: {e}")
    
    def stop(self):
        """Stop JARVIS"""
        self.running = False
        self.voice_engine.speak("Powering down. Goodbye sir.")
        self.logger.info(f"{self.name} stopped")


def main():
    jarvis = JARVIS()
    jarvis.start()

if __name__ == "__main__":
    main()
