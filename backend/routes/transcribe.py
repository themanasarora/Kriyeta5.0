import os
import tempfile
from flask import Blueprint, request, jsonify
from groq import Groq

transcribe_bp = Blueprint('transcribe', __name__)

@transcribe_bp.route('/transcribe', methods=['POST'])
def transcribe_audio():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return jsonify({"error": "Missing API Key"}), 500
    
    client = Groq(api_key=api_key)
    audio_file = request.files.get("audio")
    
    if not audio_file:
        return jsonify({"error": "No audio file provided"}), 400

    mime = audio_file.content_type or "audio/webm"
    ext = ".webm" if "webm" in mime else (".ogg" if "ogg" in mime else ".webm")

    try:
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp_path = tmp.name
            audio_file.save(tmp_path)

        with open(tmp_path, "rb") as f:
            transcription = client.audio.transcriptions.create(
                file=(os.path.basename(tmp_path), f, mime),
                model="whisper-large-v3",
                response_format="text",
                language="en",
            )

        transcript_text = transcription.strip() if isinstance(transcription, str) else transcription.text.strip()
        return jsonify({"transcript": transcript_text})

    except Exception as e:
        print("Whisper transcription error:", e)
        return jsonify({"error": f"Transcription failed: {str(e)}"}), 500

    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
