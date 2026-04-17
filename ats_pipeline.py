import os
import json
from sentence_transformers import SentenceTransformer, util
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class ATSPipeline:
    def __init__(self, model_path='models/resume_embeddings_tsdae'):
        print("Loading Embedding Model...")
        # If the local model hasn't finished training, fallback to base model for testing
        if not os.path.exists(model_path):
            print(f"Warning: Local model at {model_path} not found. Falling back to base model (all-MiniLM-L6-v2).")
            self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        else:
            self.embedder = SentenceTransformer(model_path)
        
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    def get_contextual_snippets(self, resume_text, jd_text, top_k=5):
        """Extracts the most relevant snippets from the resume for the JD."""
        # Simple chunking by newline/sentence
        chunks = [s.strip() for s in resume_text.split('\n') if len(s.strip()) > 20]
        if not chunks:
            return resume_text
            
        jd_embedding = self.embedder.encode(jd_text, convert_to_tensor=True)
        chunk_embeddings = self.embedder.encode(chunks, convert_to_tensor=True)
        
        # Calculate similarity
        cos_scores = util.cos_sim(jd_embedding, chunk_embeddings)[0]
        top_results = cos_scores.argsort(descending=True)[:top_k]
        
        relevant_snippets = [chunks[i] for i in top_results]
        return "\n".join(relevant_snippets)

    def analyze(self, resume_text, jd_text):
        print("Analyzing Resume against JD...")
        
        # 1. Get contextual snippets (the "Embedding Model" layer)
        relevant_context = self.get_contextual_snippets(resume_text, jd_text)
        
        # 2. Construct Prompt for Groq (The "LLM +1 Layer")
        prompt = f"""
        You are a senior HR specialist and recruitment analyst. Analyze the following resume fragments against the job description provided.
        
        JOB DESCRIPTION:
        {jd_text}
        
        RELEVANT RESUME FRAGMENTS:
        {relevant_context}
        
        Provide a comprehensive ATS evaluation in JSON format with the following keys:
        1. "Score": A number from 0 to 100.
        2. "Analysis": A detailed professional analysis of the fit.
        3. "Areas to Strengthen": Specific skills, certifications, or experiences the candidate is missing or needs to highlight more.
        
        Return ONLY valid JSON.
        """
        
        try:
            chat_completion = self.groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional ATS analyzer that outputs only valid JSON.",
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model="llama-3.3-70b-versatile", # Using Llama 3.3 70b (versatile/latest)
                response_format={"type": "json_object"},
            )
            
            result_json = chat_completion.choices[0].message.content
            return json.loads(result_json)
        except Exception as e:
            return {
                "error": str(e),
                "Score": 0,
                "Analysis": "Failed to generate analysis via Groq.",
                "Areas to Strengthen": "N/A"
            }

if __name__ == "__main__":
    # Example usage
    pipeline = ATSPipeline()
    
    sample_jd = """
    We are looking for a Senior Python Developer with experience in machine learning and NLP. 
    Required skills: Python, PyTorch, Scikit-learn, LLMs, and API development.
    3+ years of experience required.
    """
    
    sample_resume = """
    John Doe
    Python Developer with 5 years of experience.
    Skills: Python, Django, Flask, TensorFlow, Keras.
    Worked on several NLP projects including sentiment analysis and chatbot development.
    Experience with REST APIs and SQL databases.
    """
    
    result = pipeline.analyze(sample_resume, sample_jd)
    print(json.dumps(result, indent=2))
