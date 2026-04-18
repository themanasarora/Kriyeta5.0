import os
import uuid
from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from utils.db import get_db
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()

# ─── Email / Password Auth ─────────────────────────────────────────────────────

@auth_bp.route('/register-user', methods=['POST'])
def register():
    data = request.json
    db = get_db()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing required fields"}), 400
    
    if db.users.find_one({"email": data['email']}):
        return jsonify({"error": "User already exists"}), 400
        
    hashed = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user = {
        "name": data.get('name', ''),
        "email": data['email'],
        "password": hashed,
        "github_score": None
    }
    db.users.insert_one(user)
    
    return jsonify({"user": {"name": user['name'], "email": user['email']}}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    db = get_db()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing required fields"}), 400
    
    user = db.users.find_one({"email": data['email']})
    if user and bcrypt.check_password_hash(user['password'], data['password']):
        user_repr = {"name": user['name'], "email": user['email']}
        if user.get("github_score") is not None:
            user_repr["github_score"] = user["github_score"]
        return jsonify({"user": user_repr})
        
    return jsonify({"error": "Invalid credentials"}), 401

# ─── Google One-Tap / Sign-In with Google ─────────────────────────────────────

@auth_bp.route('/google-login', methods=['POST'])
def google_login():
    """
    Receives the Google credential JWT from the frontend (Google One-Tap),
    verifies it server-side, and upserts the user in MongoDB.
    """
    token = (request.json or {}).get('token')
    if not token:
        return jsonify({"error": "Missing Google token"}), 400

    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        return jsonify({"error": "Server misconfiguration: GOOGLE_CLIENT_ID not set"}), 500

    try:
        # Verify the token with Google's public keys
        id_info = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            client_id
        )
    except ValueError as e:
        print(f"Google token verification failed: {e}")
        return jsonify({"error": "Invalid Google token"}), 401

    email = id_info.get("email")
    name  = id_info.get("name", "")
    if not email:
        return jsonify({"error": "Google account has no email"}), 400

    db = get_db()
    existing = db.users.find_one({"email": email})

    if existing:
        # Update name if it changed (e.g. user edited their Google profile)
        if existing.get("name") != name:
            db.users.update_one({"email": email}, {"$set": {"name": name}})
        user_doc = existing
    else:
        # New user — create account with a random un-guessable password
        # so the email/password route can never be used against this account
        placeholder_pw = bcrypt.generate_password_hash(str(uuid.uuid4())).decode('utf-8')
        user_doc = {
            "name":         name,
            "email":        email,
            "password":     placeholder_pw,
            "auth_provider": "google",
            "github_score": None,
        }
        db.users.insert_one(user_doc)

    user_repr = {
        "name":  user_doc.get("name", name),
        "email": email,
    }
    if user_doc.get("github_score") is not None:
        user_repr["github_score"] = user_doc["github_score"]
    if user_doc.get("leetcode_score") is not None:
        user_repr["leetcode_score"] = user_doc["leetcode_score"]

    return jsonify({"user": user_repr})
