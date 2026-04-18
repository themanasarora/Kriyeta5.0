import os
from flask import Blueprint, request, jsonify
from groq import Groq
import json
import uuid
from datetime import datetime, timedelta
from utils.db import get_db

evaluate_bp = Blueprint('evaluate', __name__)

@evaluate_bp.route('/evaluate-interview', methods=['POST'])
def evaluate_interview():
    data = request.json
    role = data.get('role', 'Unknown Role')
    difficulty = data.get('difficulty', 'Intermediate')
    ats_score = data.get('ats_score', 0)
    qna_list = data.get('qna_list', [])
    email = data.get('email', '')

    if not qna_list:
        return jsonify({"error": "No Q&A data provided"}), 400

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    transcript_text = "\n".join([f"Q: {qna['question']}\nA: {qna['answer']}" for qna in qna_list])

    prompt = (
        f"You are an expert technical interviewer for a {role} position ({difficulty} level).\n"
        f"The candidate's initial ATS resume score was {ats_score}/100.\n"
        f"Below is the transcript of their interview:\n\n{transcript_text}\n\n"
        "Task: Evaluate the candidate's performance based ON THEIR ANSWERS. "
        "Return a strictly valid JSON object with EXACTLY the following keys:\n"
        '{"final_score": <number 0-100>, "feedback_summary": "<2-3 sentence overview>", "strengths": ["<strength1>", "<strength2>"], "weaknesses": ["<area to improve>"]}'
    )

    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a precise JSON-only evaluator. Always reply with the exact requested JSON format."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"},
            temperature=0.3
        )

        result = json.loads(response.choices[0].message.content)
        
        # Build the final payload
        interview_id = str(uuid.uuid4())
        current_date_str = datetime.utcnow().strftime('%Y-%m-%d')
        
        payload = {
            "_id": interview_id,
            "user_email": email,
            "role": role,
            "difficulty": difficulty,
            "date": datetime.utcnow().isoformat(),
            "final_score": result.get("final_score", 0),
            "feedback_summary": result.get("feedback_summary", "Evaluation complete."),
            "strengths": result.get("strengths", []),
            "weaknesses": result.get("weaknesses", []),
            "qna_list": qna_list
        }

        # Track Streaks & Save
        if email:
            db = get_db()
            db.interviews.insert_one(payload)
            
            user = db.users.find_one({"email": email})
            if user:
                last_active = user.get("last_active_date")
                streak = user.get("streak_count", 0)
                
                if last_active:
                    last_date = datetime.strptime(last_active, '%Y-%m-%d')
                    today_dt = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
                    delta = (today_dt - last_date).days
                    
                    if delta == 1:
                        streak += 1
                    elif delta > 1:
                        streak = 1
                else:
                    streak = 1
                    
                db.users.update_one(
                    {"email": email},
                    {"$set": {
                        "last_active_date": current_date_str,
                        "streak_count": streak
                    }}
                )
                payload["streak_count"] = streak

        return jsonify(payload)
    except Exception as e:
        print(f"Error eval: {e}")
        return jsonify({"error": "Failed to evaluate"}), 500

@evaluate_bp.route('/interview/<interview_id>', methods=['GET'])
def get_interview(interview_id):
    db = get_db()
    result = db.interviews.find_one({"_id": interview_id})
    if not result:
        return jsonify({"error": "Not found"}), 404
    return jsonify(result)

@evaluate_bp.route('/user-history', methods=['POST'])
def get_user_history():
    email = request.json.get("email")
    if not email:
        return jsonify({"error": "Email required"}), 400
        
    db = get_db()
    user = db.users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    interviews_cursor = db.interviews.find({"user_email": email}).sort("date", -1)
    interviews = []
    for i in interviews_cursor:
        interviews.append({
            "id": i["_id"],
            "role": i.get("role"),
            "date": i.get("date"),
            "score": i.get("final_score")
        })
        
    return jsonify({
        "streak_count": user.get("streak_count", 0),
        "interviews": interviews
    })
