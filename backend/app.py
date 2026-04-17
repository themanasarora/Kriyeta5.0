import os
import fitz  # PyMuPDF
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "venv", ".env"))

app = Flask(__name__)
CORS(app)

client = Groq(api_key=os.getenv("GROQ_API_KEY")) # fallback to key from aiinterview

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
            {"role": "system", "content": "You are an expert HR analyst. Read the resume and the job description, then provide a short summary of how well the candidate fits the role and their key strengths. Return valid JSON only."},
            {"role": "user", "content": f"Resume Text: {resume_text}\n\nJob Description: {jd}\n\nReturn JSON in this format: {{\"candidate_summary\": \"...\"}}"}
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
        return jsonify(result)
    except Exception as e:
        print("Groq error:", e)
        return jsonify({"error": "Failed to analyze resume"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)