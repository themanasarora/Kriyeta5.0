import onnxruntime as ort
from tokenizers import Tokenizer
import numpy as np
import os
from sklearn.metrics.pairwise import cosine_similarity

class ATSEngine:
    def __init__(self, model_path=None):
        try:
            if model_path is None:
                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                model_path = os.path.join(base_dir, "onnx_model")
            
            print(f"[ATS] Loading tokenizer from {model_path}...")
            tokenizer_path = os.path.join(model_path, "tokenizer.json")
            self.tokenizer = Tokenizer.from_file(tokenizer_path)
            self.tokenizer.enable_padding(pad_id=0, pad_token="[PAD]", length=512)
            self.tokenizer.enable_truncation(max_length=512)
            
            print(f"[ATS] Loading ONNX model from {model_path} (CPU Mode)...")
            # Explicitly use CPU to avoid crashes on mismatched GPU drivers/hardware
            self.session = ort.InferenceSession(
                os.path.join(model_path, "model.onnx"),
                providers=['CPUExecutionProvider']
            )
            print("[ATS] Engine initialized successfully.")
            
            # Tiny warm-up
            self.get_embedding("warm-up")
            print("[ATS] Warm-up successful.")
            
        except Exception as e:
            print(f"[ATS] FATAL ERROR during Engine Init: {e}")
            raise RuntimeError(f"Failed to load ATS Engine: {e}")


    def get_embedding(self, text):
        encoding = self.tokenizer.encode(text)
        input_ids = np.array([encoding.ids], dtype=np.int64)
        attention_mask = np.array([encoding.attention_mask], dtype=np.int64)
        token_type_ids = np.array([encoding.type_ids], dtype=np.int64)
        
        onnx_inputs = {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "token_type_ids": token_type_ids,
        }
            
        outputs = self.session.run(None, onnx_inputs)
        
        # outputs[0] is usually [batch_size, sequence_length, hidden_size]
        token_embeddings = outputs[0]
        # Perform Mean Pooling
        input_mask_expanded = np.expand_dims(onnx_inputs["attention_mask"], -1)
        sum_embeddings = np.sum(token_embeddings * input_mask_expanded, 1)
        sum_mask = np.clip(input_mask_expanded.sum(1), a_min=1e-9, a_max=None)
        return sum_embeddings / sum_mask

    def calculate_score(self, resume_text, requirement_text):
        resume_embedding = self.get_embedding(resume_text)
        req_embedding = self.get_embedding(requirement_text)
        
        similarity = cosine_similarity(resume_embedding, req_embedding)[0][0]
        # Normalize score to 0-100 and maybe apply a slight curve to make it more human-readable
        # (Standard cosine similarity for embeddings is often high, so we might want to scale it)
        score = float(similarity * 100)
        return round(min(max(score, 0), 100), 2)

# Singleton instance
_engine = None

def get_ats_engine():
    global _engine
    if _engine is None:
        _engine = ATSEngine()
    return _engine
