import os
import requests
from flask import Blueprint, request, jsonify
from groq import Groq
from utils.db import get_db

leetcode_bp = Blueprint('leetcode', __name__)

@leetcode_bp.route('/analyze-leetcode', methods=['POST'])
def analyze_leetcode():
    data = request.json
    username = data.get("username")
    email = data.get("email")
    
    if not username:
        return jsonify({"error": "Username required"}), 400
        
    url = "https://leetcode.com/graphql"
    query = """
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        profile {
            ranking
        }
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
    """
    
    variables = {"username": username}
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
    }

    try:
        r = requests.post(url, json={"query": query, "variables": variables}, headers=headers)
        if r.status_code != 200:
            return jsonify({"error": "Failed to fetch from LeetCode"}), 500
            
        gh_data = r.json()
        if "errors" in gh_data or not gh_data.get("data", {}).get("matchedUser"):
            return jsonify({"error": "LeetCode user not found"}), 404
            
        matched = gh_data["data"]["matchedUser"]
        stats = matched.get("submitStats", {}).get("acSubmissionNum", [])
        
        easy, medium, hard, total = 0, 0, 0, 0
        for stat in stats:
            if stat["difficulty"] == "All":
                total = stat["count"]
            elif stat["difficulty"] == "Easy":
                easy = stat["count"]
            elif stat["difficulty"] == "Medium":
                medium = stat["count"]
            elif stat["difficulty"] == "Hard":
                hard = stat["count"]
        
        # Algorithmic Score (Max 100)
        # Weights: Hard=3, Medium=1.5, Easy=0.5
        raw_score = (hard * 3) + (medium * 1.5) + (easy * 0.5)
        score = min(100, int((raw_score / 300) * 100))
        
        # Determine Persona
        persona = "Beginner"
        if score > 80 or hard > 30:
            persona = "Elite Competitive Programmer"
        elif score > 50 or medium > 50:
            persona = "Advanced Algorithms Developer"
        elif score > 20:
            persona = "Competent Problem Solver"

        # LLM Feedback
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        prompt = f"Analyze this LeetCode profile for recruiting: {username} has solved {total} total problems ({hard} Hard, {medium} Medium, {easy} Easy). Provide 2 sentences of highly specific feedback describing how a technical interviewer should perceive their Problem Solving capability."
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150
        )
        feedback = response.choices[0].message.content.strip()

        result = {
            "username": username,
            "total": total,
            "hard": hard,
            "medium": medium,
            "easy": easy,
            "score": score,
            "persona": persona,
            "feedback": feedback
        }

        # Save to MongoDB
        if email:
            db = get_db()
            db.users.update_one(
                {"email": email}, 
                {"$set": {
                    "leetcode_score": score, 
                    "leetcode_feedback": feedback, 
                    "leetcode_username": username,
                    "leetcode_persona": persona
                }}
            )
            
        return jsonify(result)
        
    except Exception as e:
        print("LeetCode Fetch Error:", e)
        return jsonify({"error": "Server error processing LeetCode data"}), 500
