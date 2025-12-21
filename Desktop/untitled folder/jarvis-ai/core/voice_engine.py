"""
Voice Recognition and Text-to-Speech Engine
- Detects available audio backends: PyAudio or sounddevice
- Falls back to text input when no audio backend is available
- Handles missing 'speech_recognition' import gracefully
"""
import threading
from typing import Callable, Optional

# speech_recognition may not be installed in the interpreter running this script
try:
    import speech_recognition as sr  # type: ignore
    SR_AVAILABLE = True
except Exception:
    sr = None  # type: ignore
    SR_AVAILABLE = False

import pyttsx3

class VoiceEngine:
    def __init__(self, rate=150, volume=0.9):
        # sr may be None if not installed
        self.sr_available = SR_AVAILABLE
        if self.sr_available:
            self.recognizer = sr.Recognizer()
        else:
            self.recognizer = None

        self.engine = pyttsx3.init()
        self.engine.setProperty('rate', rate)
        self.engine.setProperty('volume', volume)
        self.listening = False

        # Detect audio backend availability
        self.audio_backend = self._detect_audio_backend()

    def _detect_audio_backend(self) -> Optional[str]:
        """Return 'pyaudio', 'sounddevice', or None if no backend available."""
        if not self.sr_available:
            # speech_recognition not installed — can't use audio backends
            return None

        try:
            import pyaudio  # type: ignore
            return 'pyaudio'
        except Exception:
            # Try sounddevice as a fallback
            try:
                import sounddevice  # type: ignore
                return 'sounddevice'
            except Exception:
                return None

    def get_install_instructions(self) -> str:
        """Return platform-specific instructions to enable voice input."""
        import platform

        plat = platform.system().lower()
        instructions = [
            "Voice backends not found. You can enable voice input by installing one of the audio backends:",
            "\nRecommended: sounddevice (easier on modern systems).\n",
        ]

        if 'darwin' in plat or 'mac' in plat:
            instructions += [
                "macOS (Homebrew):",
                "  brew install libsndfile",
                "  # then inside your virtualenv:",
                "  pip install sounddevice",
                "\nOr for PyAudio (alternative):",
                "  brew install portaudio",
                "  pip install pyaudio",
            ]
        elif 'linux' in plat:
            instructions += [
                "Debian/Ubuntu:",
                "  sudo apt update && sudo apt install libsndfile1 portaudio19-dev python3-dev build-essential",
                "  pip install sounddevice",
                "\nOr for PyAudio:",
                "  pip install pyaudio",
            ]
        elif 'windows' in plat:
            instructions += [
                "Windows:",
                "  # Recommended: use pipwin to install PyAudio binary",
                "  pip install pipwin",
                "  pipwin install pyaudio",
                "  # Or try sounddevice:",
                "  pip install sounddevice",
            ]
        else:
            instructions += [
                "Generic instructions:",
                "  pip install sounddevice",
                "  # If that fails, install system audio dependency (libsndfile/portaudio) first",
            ]

        instructions += [
            "\nAfter installing, activate your virtualenv (if used) and re-run JARVIS:\n  source venv/bin/activate\n  python main.py",
            "\nTo verify installation from Python:\n  python -c \"from core.voice_engine import VoiceEngine; v=VoiceEngine(); print('sr_available=', v.sr_available, 'audio_backend=', v.audio_backend)\"",
        ]

        return "\n".join(instructions)
    def speak(self, text: str) -> None:
        """Convert text to speech"""
        try:
            self.engine.say(text)
            self.engine.runAndWait()
        except Exception as e:
            # pyttsx3 can raise "run loop already started" in some GUI contexts — handle gracefully
            try:
                # Try a safer approach: restart the engine
                self.engine.stop()
                self.engine.say(text)
                self.engine.runAndWait()
            except Exception:
                print(f"Error in text-to-speech: {e}")

    def listen(self, timeout: int = 30) -> Optional[str]:
        """Listen to user input via microphone or fallback to None if unavailable."""
        if not self.sr_available:
            return None

        if self.audio_backend == 'pyaudio':
            try:
                with sr.Microphone() as source:
                    audio = self.recognizer.listen(source, timeout=timeout)
                    text = self.recognizer.recognize_google(audio)
                    return text.lower()
            except Exception as e:
                # generic catch — includes UnknownValueError / RequestError
                print(f"Audio error (pyaudio): {e}")
                return None

        elif self.audio_backend == 'sounddevice':
            try:
                import sounddevice as sd  # type: ignore

                sample_rate = 16000
                duration = min(timeout, 10)  # cap recording to 10s for safety
                sd.default.samplerate = sample_rate
                sd.default.channels = 1

                recording = sd.rec(int(duration * sample_rate), dtype='float32')
                sd.wait()

                # Convert float32 [-1,1] to int16
                audio_data = (recording.flatten() * 32767).astype('<i2').tobytes()
                audio = sr.AudioData(audio_data, sample_rate, 2)
                text = self.recognizer.recognize_google(audio)
                return text.lower()
            except Exception as e:
                print(f"Audio error (sounddevice): {e}")
                return None

        else:
            # No audio backend available
            return None

    def listen_async(self, callback: Callable[[str], None], timeout: int = 30) -> None:
        """Listen asynchronously"""
        thread = threading.Thread(target=self._listen_thread, args=(callback, timeout))
        thread.daemon = True
        thread.start()

    def _listen_thread(self, callback: Callable[[str], None], timeout: int) -> None:
        result = self.listen(timeout)
        if result:
            callback(result)
