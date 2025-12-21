"""
Main entry point for JARVIS AI Application
Supports voice commands and system integration
"""
import sys
import os
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))


def _warn_if_not_using_venv():
    # If repo has a 'venv' but the current process doesn't appear to be using a virtualenv,
    # show a friendly hint to the user.
    venv_dir = Path(__file__).parent / 'venv'
    if venv_dir.exists() and 'VIRTUAL_ENV' not in os.environ:
        print("⚠️  Notice: a virtual environment is present at './venv' but it doesn't look like it's activated.")
        print('Recommended: activate it and re-run to ensure all dependencies are available:')
        print('  source venv/bin/activate')
        print('Or run directly with the venv python:')
        print('  ./venv/bin/python main.py')
        print()


_warn_if_not_using_venv()

try:
    from core.jarvis import JARVIS
except ModuleNotFoundError as e:
    # Provide actionable guidance if optional dependencies are missing or user launched with system python
    print(f"Error importing application modules: {e}")
    print("If you haven't installed dependencies yet, run:")
    print("  source venv/bin/activate && pip install -r requirements.txt")
    print("Or run using the venv python: ./venv/bin/python main.py")
    raise

import argparse


def main():
    parser = argparse.ArgumentParser(description='JARVIS AI Assistant')
    parser.add_argument('--mode', choices=['voice', 'text', 'gui'], 
                       default='voice', help='Mode of interaction')
    parser.add_argument('--no-voice', action='store_true', 
                       help='Disable voice output')
    
    args = parser.parse_args()
    
    jarvis = JARVIS()
    
    try:
        jarvis.start()
    except KeyboardInterrupt:
        print()
        print('Shutting down JARVIS...')
        jarvis.stop()


if __name__ == "__main__":
    main()
