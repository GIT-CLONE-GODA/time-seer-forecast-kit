
import subprocess
import sys
import os

def start_api_server():
    # Check if API requirements are installed
    try:
        import flask
        import flask_cors
    except ImportError:
        print("Installing API server dependencies...")
        requirements_api_path = "requirements_api.txt"
        if os.path.exists(requirements_api_path):
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", requirements_api_path])
        else:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "flask", "flask-cors"])
    
    # Run the API server
    print("Starting API server on http://localhost:5000...")
    subprocess.call([sys.executable, "api_server.py"])

if __name__ == "__main__":
    start_api_server()
