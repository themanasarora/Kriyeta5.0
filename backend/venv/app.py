from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os 

# LOAD ENVIRONMENT FIRST
load_dotenv()

# IMPORT ROUTES AFTER ENV IS LOADED
from routes.ats import ats_bp
from routes.question import question_bp
from routes.evaluate import evaluate_bp

app = Flask(__name__)
# Explicit CORS for local development
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Register Blueprints
app.register_blueprint(ats_bp, url_prefix='/api')
app.register_blueprint(question_bp, url_prefix='/api')
app.register_blueprint(evaluate_bp, url_prefix='/api')

# ADD THIS LINE TO TEST MANUALLY
@app.route('/test')
def test():
    return "Backend is reachable!"

if __name__ == '__main__':
    print("\n--- 🚀 KRIYETA BACKEND STARTING ---")
    if not os.getenv("GROQ_API_KEY"):
        print("❌ ERROR: GROQ_API_KEY is missing from .env file!")
    else:
        print("✅ API Key Detected.")
    
    print("\n--- REGISTERED ROUTES ---")
    for rule in app.url_map.iter_rules():
        print(f"URL: {rule.rule}  -->  Endpoint: {rule.endpoint}")
    print("--------------------------\n")

    app.run(debug=True, port=5000)