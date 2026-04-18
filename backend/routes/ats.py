import fitz  # PyMuPDF
import os
from flask import Blueprint, request, jsonify
from groq import Groq

from utils.ats_engine import get_ats_engine

ats_bp = Blueprint('ats', __name__)

def extract_text_from_pdf(file_storage):
    # Reset file pointer to start before reading
    file_storage.seek(0)
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
    
    target_role = request.form.get('role', 'Software Engineer')
    difficulty = request.form.get('difficulty', 'Intermediate')
    resume_file = request.files['resume']
    
    try:
        resume_text = extract_text_from_pdf(resume_file)
        
        # 1. Calculate Score using ONNX Model
        try:
            engine = get_ats_engine()
        except RuntimeError as e:
            print(f"[ATS] Error initializing engine: {e}")
            return jsonify({"error": "ATS Engine failed to load. Please check console for details.", "details": str(e)}), 500

        # Create a synthetic JD for comparison if one isn't provided
        requirement_text = f"Professional requirements and skills for a {difficulty} level {target_role}. Key competencies, technical stack, and industry standards for this position."
        
        onnx_score = engine.calculate_score(resume_text, requirement_text)


        # 2. Get Qualitative Analysis & Final Scoring from LLM
        analysis_prompt = (
            f"Role: {target_role}\n"
            f"Target Level: {difficulty}\n"
            f"ML Semantic Similarity Baseline: {onnx_score}/100\n"
            f"Resume Content: {resume_text[:4000]}\n\n"
            "Task: Act as an expert HR analyst. Analyze the resume against the role requirements.\n"
            f"The ML model has assigned a semantic similarity score of {onnx_score} as a baseline. "
            "Your job is to provide the final 'Adjusted Match Score' based on this baseline, but also accounting for: "
            "specific technical keywords, project relevance, experience depth, and overall resume quality.\n"
            "Provide a response strictly in JSON format with exactly these keys:\n"
            "{\"final_match_score\": <number 0-100>, "
            "\"candidate_summary\": \"<2-sentence summary of the candidate's professional profile and fit>\", "
            "\"resume_feedback\": \"<Bullet points (3-5) of specific areas to strengthen, missing keywords, or missing skills for this role>\"}"
        )

        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a specialized ATS Scoring & Feedback Engine. You combine ML metrics with HR reasoning."},
                {"role": "user", "content": analysis_prompt}
            ],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"},
            temperature=0.3
        )
        
        import json
        llm_result = json.loads(response.choices[0].message.content)

        # Ensure feedback is a string for the frontend's .split('\n')
        feedback = llm_result.get("resume_feedback", "No specific feedback available.")
        if isinstance(feedback, list):
            feedback = "\n".join(feedback)

        # Final Combined Result
        # We now use the LLM's adjusted score as the primary 'match_score'
        final_score = llm_result.get("final_match_score", onnx_score)

        return jsonify({
            "match_score": final_score,
            "onnx_baseline": onnx_score,
            "candidate_summary": llm_result.get("candidate_summary", "No summary generated."),
            "resume_feedback": feedback,
            "status": "Success"
        })




    except Exception as e:
        import traceback
        print("\n--- ❌ ATS ROUTE ERROR ---")
        traceback.print_exc()
        print("--------------------------\n")
        return jsonify({"error": "Internal processing error", "details": str(e)}), 500