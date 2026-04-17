import os
from flask import Blueprint, request, jsonify
from groq import Groq
import json

evaluate_bp = Blueprint('evaluate', __name__)

@evaluate_bp.route('/evaluate-interview', methods=['POST'])
def evaluate_interview():
    data = request.json
    role = data.get('role', 'Unknown Role')
    difficulty = data.get('difficulty', 'Intermediate')
    ats_score = data.get('ats_score', 0)
    qna_list = data.get('qna_list', [])

    if not qna_list:
        return jsonify({"error": "No Q&A data provided"}), 400

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    # Format transcript
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
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
            temperature=0.3
        )

        result = json.loads(response.choices[0].message.content)
        return jsonify({
            "final_score": result.get("final_score", 0),
            "feedback_summary": result.get("feedback_summary", "Evaluation complete."),
            "strengths": result.get("strengths", []),
            "weaknesses": result.get("weaknesses", []),
            "status": "Success"
        })
    except Exception as e:
        print(f"Error eval: {e}")
        return jsonify({"error": "Failed to evaluate"}), 500
