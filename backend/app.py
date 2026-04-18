import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# Import Blueprints
from routes.ats import ats_bp
from routes.question import question_bp
from routes.evaluate import evaluate_bp
from routes.transcribe import transcribe_bp
from routes.auth import auth_bp
from routes.github import github_bp
from routes.leetcode import leetcode_bp
from routes.confidence import confidence_bp

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")

# Explicit CORS for local development
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Register Blueprints
app.register_blueprint(ats_bp, url_prefix='/api')
app.register_blueprint(question_bp, url_prefix='/api')
app.register_blueprint(evaluate_bp, url_prefix='/api')
app.register_blueprint(transcribe_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(github_bp, url_prefix='/api')
app.register_blueprint(leetcode_bp, url_prefix='/api')
app.register_blueprint(confidence_bp, url_prefix='/api')

@app.route('/health')
def health():
    return jsonify({"status": "up", "api_key_status": "present" if os.getenv("GROQ_API_KEY") else "missing"})

if __name__ == "__main__":
    print("\n--- 🚀 KRIYETA BACKEND STARTING ---")
    if not os.getenv("GROQ_API_KEY"):
        print("❌ ERROR: GROQ_API_KEY is missing!")
    else:
        print("✅ API Key Detected.")
    
    print("\n--- REGISTERED ROUTES ---")
    for rule in app.url_map.iter_rules():
        if not str(rule.rule).startswith('/static'):
            print(f"URL: {rule.rule}  -->  Endpoint: {rule.endpoint}")
    print("--------------------------\n")

    app.run(debug=True, port=5000)
