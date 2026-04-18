import os
<<<<<<< HEAD
import json
import requests
import fitz  # PyMuPDF
from flask import Flask, request, jsonify, redirect, session
=======
from flask import Flask, request, jsonify
>>>>>>> 109308d26f0a2a82a88204e258644f4caab9e7b0
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), "venv", ".env"))

# Import Blueprints
from routes.ats import ats_bp
from routes.question import question_bp
from routes.evaluate import evaluate_bp
from routes.transcribe import transcribe_bp

app = Flask(__name__)
<<<<<<< HEAD
app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
CORS(app, supports_credentials=True)
=======
# Explicit CORS for local development
CORS(app, resources={r"/api/*": {"origins": "*"}})
>>>>>>> 109308d26f0a2a82a88204e258644f4caab9e7b0

# Register Blueprints
app.register_blueprint(ats_bp, url_prefix='/api')
app.register_blueprint(question_bp, url_prefix='/api')
app.register_blueprint(evaluate_bp, url_prefix='/api')
app.register_blueprint(transcribe_bp, url_prefix='/api')

<<<<<<< HEAD
# In-memory storage (replace with database in production)
USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")

def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, "r") as f:
            return json.load(f)
    return []

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

@app.route("/api/register-user", methods=["POST"])
def register_user():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    name = data.get("name")
    email = data.get("email")
    password = data.get("password", "")
    
    if not name or not email:
        return jsonify({"error": "Name and email are required"}), 400
    
    users = load_users()
    
    # Check if user already exists
    for user in users:
        if user.get("email") == email:
            return jsonify({"error": "User already exists"}), 400
    
    # Add new user
    new_user = {
        "id": len(users) + 1,
        "name": name,
        "email": email,
        "password": password,  # In production, hash this!
        "phone": data.get("phone", ""),
        "experience": data.get("experience", "0"),
        "targetRole": data.get("targetRole", "Software Engineer"),
        "oauth_provider": data.get("oauth_provider", None)
    }
    users.append(new_user)
    save_users(users)
    
    # Return user without password
    user_response = {k: v for k, v in new_user.items() if k != 'password'}
    return jsonify({"message": "User registered successfully", "user": user_response}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    
    users = load_users()
    
    for user in users:
        if user.get("email") == email:
            # Check password (in production, use proper hashing!)
            if user.get("password") == password or not user.get("password"):
                user_response = {k: v for k, v in user.items() if k != 'password'}
                return jsonify({"message": "Login successful", "user": user_response}), 200
            return jsonify({"error": "Invalid password"}), 401
    
    return jsonify({"error": "User not found. Please register."}), 404

@app.route("/api/auth/google", methods=["GET"])
def auth_google():
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    
    if not client_id or client_id.startswith("your_"):
        return jsonify({"error": "Google OAuth not configured. Add credentials to .env file."}), 501
    
    # Build Google OAuth URL
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope=openid email profile&"
        f"access_type=offline"
    )
    return redirect(auth_url)

@app.route("/api/auth/google/callback", methods=["GET"])
def auth_google_callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "No authorization code received"}), 400
    
    try:
        # Exchange code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": os.getenv("GOOGLE_REDIRECT_URI")
        }
        
        token_response = requests.post(token_url, data=token_data)
        tokens = token_response.json()
        
        if "access_token" not in tokens:
            return jsonify({"error": "Failed to get access token"}), 400
        
        # Get user info from Google
        userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        userinfo = requests.get(userinfo_url, headers=headers).json()
        
        # Create or update user
        users = load_users()
        user = next((u for u in users if u.get("email") == userinfo.get("email")), None)
        
        if not user:
            user = {
                "id": len(users) + 1,
                "name": userinfo.get("name", ""),
                "email": userinfo.get("email"),
                "password": None,
                "oauth_provider": "google",
                "picture": userinfo.get("picture")
            }
            users.append(user)
            save_users(users)
        
        # Return user data (frontend will handle redirect)
        user_response = {k: v for k, v in user.items() if k != 'password'}
        return redirect(f"http://localhost:3000/setup?oauth=google&user={json.dumps(user_response)}")
        
    except Exception as e:
        return jsonify({"error": f"Google OAuth failed: {str(e)}"}), 500

@app.route("/api/auth/linkedin", methods=["GET"])
def auth_linkedin():
    client_id = os.getenv("LINKEDIN_CLIENT_ID")
    redirect_uri = os.getenv("LINKEDIN_REDIRECT_URI")
    
    if not client_id or client_id.startswith("your_"):
        return jsonify({"error": "LinkedIn OAuth not configured. Add credentials to .env file."}), 501
    
    # Build LinkedIn OAuth URL
    auth_url = (
        f"https://www.linkedin.com/oauth/v2/authorization?"
        f"response_type=code&"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"scope=r_liteprofile r_emailaddress"
    )
    return redirect(auth_url)

@app.route("/api/auth/linkedin/callback", methods=["GET"])
def auth_linkedin_callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "No authorization code received"}), 400
    
    try:
        # Exchange code for tokens
        token_url = "https://www.linkedin.com/oauth/v2/accessToken"
        token_data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": os.getenv("LINKEDIN_REDIRECT_URI"),
            "client_id": os.getenv("LINKEDIN_CLIENT_ID"),
            "client_secret": os.getenv("LINKEDIN_CLIENT_SECRET")
        }
        
        token_response = requests.post(token_url, data=token_data)
        tokens = token_response.json()
        
        if "access_token" not in tokens:
            return jsonify({"error": "Failed to get access token"}), 400
        
        # Get user profile from LinkedIn
        profile_url = "https://api.linkedin.com/v2/me"
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        profile = requests.get(profile_url, headers=headers).json()
        
        # Get email from LinkedIn
        email_url = "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))"
        email_data = requests.get(email_url, headers=headers).json()
        email = email_data.get("elements", [{}])[0].get("handle~", {}).get("emailAddress", "")
        
        # Create or update user
        users = load_users()
        user = next((u for u in users if u.get("email") == email), None)
        
        if not user:
            user = {
                "id": len(users) + 1,
                "name": f"{profile.get('localizedFirstName', '')} {profile.get('localizedLastName', '')}".strip(),
                "email": email,
                "password": None,
                "oauth_provider": "linkedin",
                "linkedin_id": profile.get("id")
            }
            users.append(user)
            save_users(users)
        
        # Return user data
        user_response = {k: v for k, v in user.items() if k != 'password'}
        return redirect(f"http://localhost:3000/setup?oauth=linkedin&user={json.dumps(user_response)}")
        
    except Exception as e:
        return jsonify({"error": f"LinkedIn OAuth failed: {str(e)}"}), 500

@app.route("/api/analyze-resume", methods=["POST"])
def analyze_resume():
    if 'resume' not in request.files:
        return jsonify({"error": "No resume file provided"}), 400
    
    file = request.files['resume']
    jd = request.form.get('job_description', '')
    
    # Extract text from PDF
    try:
        pdf_document = fitz.open(stream=file.read(), filetype="pdf")
        resume_text = ""
        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]
            resume_text += page.get_text()
    except Exception as e:
        return jsonify({"error": f"Failed to parse PDF: {str(e)}"}), 400

    # Call Groq to summarize
    try:
        messages = [
            {"role": "system", "content": "You are an expert HR analyst. Read the resume and the job description, then evaluate the candidate. You must return valid JSON matching the exact schema."},
            {"role": "user", "content": f"Resume Text: {resume_text}\n\nJob Description: {jd}\n\nAnalyze the resume against the job description. Return JSON strictly in this format:\n{{\n  \"candidate_summary\": \"A 2-3 sentence string summarizing how well the candidate fits the role and their key strengths.\",\n  \"resume_feedback\": \"A string with 2-3 bullet points on areas to strengthen, using exact format '- Point 1\\n- Point 2'\",\n  \"match_score\": 85\n}}"}
        ]
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=500
        )
        import json
        result = json.loads(response.choices[0].message.content or "{}")
        
        # Robustly handle if LLM returns an object instead of a string for candidate_summary
        if isinstance(result.get("candidate_summary"), dict):
            summary_dict = result["candidate_summary"]
            result["candidate_summary"] = " ".join([str(v) for v in summary_dict.values()])
        return jsonify(result)
    except Exception as e:
        print("Groq error:", e)
        return jsonify({"error": "Failed to analyze resume"}), 500
=======
@app.route('/health')
def health():
    return jsonify({"status": "up", "api_key_status": "present" if os.getenv("GROQ_API_KEY") else "missing"})
>>>>>>> 109308d26f0a2a82a88204e258644f4caab9e7b0

if __name__ == "__main__":
    print("\n--- 🚀 KRIYETA BACKEND STARTING ---")
    if not os.getenv("GROQ_API_KEY"):
        print("❌ ERROR: GROQ_API_KEY is missing!")
    else:
        print("✅ API Key Detected.")
    
    print("\n--- REGISTERED ROUTES ---")
    for rule in app.url_map.iter_rules():
        print(f"URL: {rule.rule}  -->  Endpoint: {rule.endpoint}")
    print("--------------------------\n")

    app.run(debug=True, port=5000)

