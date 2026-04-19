import os
import requests
from flask import Blueprint, request, jsonify
from groq import Groq
from utils.db import get_db

github_bp = Blueprint('github', __name__)

@github_bp.route('/analyze-github', methods=['POST'])
def analyze_github():
    data = request.json
    username = data.get("username")
    email = data.get("email") # To tie to the user
    
    if not username:
        return jsonify({"error": "Username required"}), 400
        
    # Fetch from Github API
    r = requests.get(f"https://api.github.com/users/{username}")
    if r.status_code != 200:
        return jsonify({"error": "GitHub user not found"}), 404
        
    gh_data = r.json()
    repos = gh_data.get("public_repos", 0)
    followers = gh_data.get("followers", 0)
    name = gh_data.get("name", username)
    avatar = gh_data.get("avatar_url", "")
    
    # Calculate score logic (max 100)
    score = min(100, (repos * 2) + (followers * 3))
    
    # LLM Feedback
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    prompt = f"Analyze this GitHub profile briefly: The user {name} ({username}) has {repos} public repositories and {followers} followers. Provide 2 sentences of constructive feedback on how a recruiter might view this profile."
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150
        )
        feedback = response.choices[0].message.content.strip()
    except Exception as e:
        print("Groq Github Eval Error:", e)
        feedback = "Solid profile, keep pushing code and engaging with open source!"
        
    result = {
        "username": username,
        "avatar": avatar,
        "score": score,
        "repos": repos,
        "followers": followers,
        "feedback": feedback
    }

    # Save to MongoDB
    if email:
        db = get_db()
        db.users.update_one(
            {"email": email}, 
            {"$set": {
                "github_score": score, 
                "github_feedback": feedback, 
                "github_username": username
            }}
        )
        
    return jsonify(result)
