import fitz  # PyMuPDF
import os
from flask import Blueprint, request, jsonify
from groq import Groq

ats_bp = Blueprint('ats', __name__)

def extract_text_from_pdf(file_storage):
    doc = fitz.open(stream=file_storage.read(), filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text

@ats_bp.route('/analyze-resume', methods=['POST'])
def analyze_resume():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return jsonify({"error": "Missing API Key"}), 500
    
    client = Groq(api_key=api_key)

    if 'resume' not in request.files:
        return jsonify({"error": "No resume file uploaded"}), 400
    
    # We now pull 'role' and 'difficulty' instead of 'job_description'
    target_role = request.form.get('role', 'Software Engineer')
    difficulty = request.form.get('difficulty', 'Intermediate')
    resume_file = request.files['resume']
    
    try:
        resume_text = extract_text_from_pdf(resume_file)

        # AI Prompt: Act as an Industry Expert ATS
        analysis_prompt = (
            f"Role: {target_role}\n"
            f"Target Level: {difficulty}\n"
            f"Resume Content: {resume_text[:3000]}\n\n"
            "Task: Evaluate this resume against industry standards for the role and level above.\n"
            "Provide a response strictly in JSON format with exactly these keys:\n"
            '{"match_score": <number 0-100>, "candidate_summary": "<2-sentence summary>", "resume_feedback": "<3 bullet points of missing skills>"}'
        )
        
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an expert HR Applicant Tracking System. You must always reply with valid JSON."},
                {"role": "user", "content": analysis_prompt}
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
            temperature=0.2
        )
        
        import json
        result = json.loads(response.choices[0].message.content)

        return jsonify({
            "match_score": result.get("match_score", 0),
            "candidate_summary": result.get("candidate_summary", "No summary generated."),
            "resume_feedback": result.get("resume_feedback", "No improvements found."),
            "status": "Success"
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": "Internal processing error"}), 500