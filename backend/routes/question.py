from flask import Blueprint, request, jsonify
from groq import Groq
import os
import json
from utils.db import get_db

question_bp = Blueprint('question', __name__)

@question_bp.route('/generate-question', methods=['POST'])
def generate_question():
    data = request.json
    summary = data.get('summary', '')
    role = data.get('role', 'Software Engineer')
    difficulty = data.get('difficulty', 'Intermediate')
    step = data.get('currentStep', 1)
    prev_question = data.get('prev_question', '')
    prev_answer = data.get('prev_answer', '')
    email = data.get('email', '')

    # Fetch Candidate Analytics from MongoDB to bias difficulty
    github_score, leetcode_score, leetcode_persona = None, None, None
    if email:
        db = get_db()
        user = db.users.find_one({"email": email})
        if user:
            github_score = user.get("github_score")
            leetcode_score = user.get("leetcode_score")
            leetcode_persona = user.get("leetcode_persona")
            
    matrix_prompt = ""
    if github_score or leetcode_score:
        matrix_prompt = "\n\nCANDIDATE PROFILE INTELLIGENCE (Adjust severity based on this):\n"
        if github_score:
            matrix_prompt += f"- GitHub Open Source Score: {github_score}/100\n"
        if leetcode_score:
            matrix_prompt += f"- LeetCode Rating: {leetcode_score}/100. Persona: {leetcode_persona}\n"
            if leetcode_score > 70:
                matrix_prompt += "-> IMPORTANT: They are an Elite Algorithmic Coder! Skip basic/theoretical questions. Ask a highly complex System Architecture or Graph/Dynamic Programming edge case!\n"
            elif leetcode_score < 30:
                matrix_prompt += "-> They are a Junior coder. Focus on fundamental problem solving and standard logic structures.\n"
                
    # 🌟 NEW: Fetch historical weaknesses for continuous learning loop
    past_weaknesses = []
    if email:
        db = get_db()
        last_interview = db.interviews.find({"user_email": email}).sort("date", -1).limit(1)
        try:
            last = next(last_interview)
            past_weaknesses = last.get("weaknesses", [])
        except StopIteration:
            pass

    if past_weaknesses:
        matrix_prompt += "\n🚀 HISTORICAL AI FEEDBACK:\n"
        matrix_prompt += "In their PREVIOUS interview, they struggled with: " + ", ".join(past_weaknesses) + ".\n"
        matrix_prompt += "-> IMPORTANT: Test if they have improved their understanding of these exact concepts in your next question!\n"

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    has_previous = bool(prev_question and prev_answer)

    current_step_int = int(step)
    
    if has_previous:
        behavioral_context = ""
        if current_step_int == 3:
            behavioral_context = ("\n-> IMPORTANT: This is Step 3. STOP asking technical questions. "
                                 "Generate one Behavioral/Soft-Skill/Culture-fit question instead. "
                                 "Examples: conflict resolution, teamwork, or motivation. Under 30 words.\n")
        
        prompt = (
            f"You are an expert interviewer for a {role} position ({difficulty} level).\n"
            f"Candidate Resume Summary: {summary}\n"
            f"{matrix_prompt}{behavioral_context}\n"
            f"PREVIOUS QUESTION: {prev_question}\n"
            f"CANDIDATE'S ANSWER: {prev_answer}\n\n"
            f"Task: First, give brief constructive feedback on their answer (1-2 sentences, encouraging but honest). "
            f"Then generate question #{step} — a deep, practical question that builds on the flow. "
            f"Keep the next question under 30 words.\n\n"
            f"Respond ONLY in this exact JSON format:\n"
            '{{"answer_feedback": "<1-2 sentence feedback on their previous answer>", "next_question": "<the next interview question>"}}'
        )
    else:
        # Initial question (Step 1)
        prompt = (
            f"You are an expert interviewer for a {role} position ({difficulty} level).\n"
            f"Candidate Resume Summary: {summary}\n"
            f"{matrix_prompt}\n"
            f"Generate interview question #{step}. Make it practical and role-specific. Under 30 words.\n\n"
            f"Respond ONLY in this exact JSON format:\n"
            '{{"answer_feedback": "", "next_question": "<the interview question>"}}'
        )

    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a precise JSON-only interviewer. Always reply with the exact JSON format requested."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
            temperature=0.7,
        )

        result = json.loads(response.choices[0].message.content)
        return jsonify({
            "next_question": result.get("next_question", "Tell me about yourself."),
            "answer_feedback": result.get("answer_feedback", "")
        })
    except Exception as e:
        print("Groq Generate Question Error:", e)
        return jsonify({
            "next_question": "Can you elaborate further on your experience?",
            "answer_feedback": "Thank you for your response."
        })