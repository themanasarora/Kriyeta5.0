from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from utils.db import get_db

auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()

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
