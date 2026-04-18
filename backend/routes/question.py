from flask import Blueprint, request, jsonify
from groq import Groq
import os
import json

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

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    has_previous = bool(prev_question and prev_answer)

    if has_previous:
        prompt = (
            f"You are an expert interviewer for a {role} position ({difficulty} level).\n"
            f"Candidate Resume Summary: {summary}\n\n"
            f"PREVIOUS QUESTION: {prev_question}\n"
            f"CANDIDATE'S ANSWER: {prev_answer}\n\n"
            f"Task: First, give brief constructive feedback on their answer (1-2 sentences, encouraging but honest). "
            f"Then generate question #{step} — a deep, practical question that builds on what they said. "
            f"Keep the next question under 30 words.\n\n"
            f"Respond ONLY in this exact JSON format:\n"
            '{{"answer_feedback": "<1-2 sentence feedback on their previous answer>", "next_question": "<the next interview question>"}}'
        )
    else:
        prompt = (
            f"You are an expert interviewer for a {role} position ({difficulty} level).\n"
            f"Candidate Resume Summary: {summary}\n\n"
            f"Generate interview question #{step}. Make it practical and role-specific. Under 30 words.\n\n"
            f"Respond ONLY in this exact JSON format:\n"
            '{{"answer_feedback": "", "next_question": "<the interview question>"}}'
        )

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