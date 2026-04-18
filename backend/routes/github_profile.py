import os
import json
import requests
from flask import Blueprint, request, jsonify
from groq import Groq

github_profile_bp = Blueprint('github_profile', __name__)

GITHUB_API = "https://api.github.com"


@github_profile_bp.route('/github-profile', methods=['POST'])
def analyze_github_profile():
    """
    Accepts { "username": "..." }
    1. Fetches repo count, stars, languages, and activeness from GitHub API
    2. Sends that data to Groq for improvement suggestions
    """
    data = request.get_json()
    if not data or not data.get("username"):
        return jsonify({"error": "GitHub username is required"}), 400

    username = data["username"].strip()

    # ── 1. Fetch basic user info ──────────────────────────────────
    user_resp = requests.get(f"{GITHUB_API}/users/{username}", timeout=10)
    if user_resp.status_code == 404:
        return jsonify({"error": f"GitHub user '{username}' not found"}), 404
    if user_resp.status_code == 403:
        return jsonify({"error": "GitHub API rate limit exceeded. Try again later."}), 429
    if user_resp.status_code != 200:
        return jsonify({"error": "Failed to fetch GitHub profile"}), 502

    user = user_resp.json()

    # ── 2. Fetch public repos (paginated, up to 300) ──────────────
    repos = []
    page = 1
    while page <= 3:
        repos_resp = requests.get(
            f"{GITHUB_API}/users/{username}/repos",
            params={"per_page": 100, "page": page, "sort": "updated"},
            timeout=10
        )
        if repos_resp.status_code != 200:
            break
        batch = repos_resp.json()
        if not batch:
            break
        repos.extend(batch)
        page += 1

    # ── 3. Extract only what we need ──────────────────────────────
    total_stars = sum(r.get("stargazers_count", 0) for r in repos)

    # Language breakdown
    language_counts = {}
    for r in repos:
        lang = r.get("language")
        if lang:
            language_counts[lang] = language_counts.get(lang, 0) + 1
    top_languages = sorted(language_counts.items(), key=lambda x: x[1], reverse=True)

    # Activeness — recent push dates & public events
    recent_pushes = []
    for r in sorted(repos, key=lambda r: r.get("pushed_at", ""), reverse=True)[:5]:
        recent_pushes.append({
            "repo": r.get("name"),
            "pushed_at": r.get("pushed_at"),
        })

    events_resp = requests.get(
        f"{GITHUB_API}/users/{username}/events/public",
        params={"per_page": 100},
        timeout=10
    )
    events = events_resp.json() if events_resp.status_code == 200 else []
    total_recent_events = len(events)

    # Determine an activeness label
    if total_recent_events >= 60:
        activeness = "Very Active"
    elif total_recent_events >= 30:
        activeness = "Active"
    elif total_recent_events >= 10:
        activeness = "Moderately Active"
    elif total_recent_events >= 1:
        activeness = "Low Activity"
    else:
        activeness = "Inactive"

    github_data = {
        "username": user.get("login"),
        "name": user.get("name") or user.get("login"),
        "avatar_url": user.get("avatar_url"),
        "profile_url": user.get("html_url"),
        "bio": user.get("bio", ""),
        "repo_count": user.get("public_repos", 0),
        "total_stars": total_stars,
        "followers": user.get("followers", 0),
        "activeness": activeness,
        "recent_events_count": total_recent_events,
        "top_languages": [{"language": l, "count": c} for l, c in top_languages],
        "recent_pushes": recent_pushes,
    }

    # ── 4. Send to Groq for improvement analysis ─────────────────
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        # Return raw data without AI analysis if no key
        return jsonify({"github": github_data, "analysis": None, "error_detail": "GROQ_API_KEY not set"})

    client = Groq(api_key=api_key)

    prompt = (
        f"Analyze this GitHub developer profile and provide actionable improvement suggestions.\n\n"
        f"Developer: {github_data['name']} (@{github_data['username']})\n"
        f"Bio: {github_data['bio'] or 'Not set'}\n"
        f"Public Repositories: {github_data['repo_count']}\n"
        f"Total Stars: {github_data['total_stars']}\n"
        f"Followers: {github_data['followers']}\n"
        f"Activeness: {github_data['activeness']} ({github_data['recent_events_count']} recent public events)\n"
        f"Top Languages: {', '.join(l['language'] + ' (' + str(l['count']) + ' repos)' for l in github_data['top_languages'][:8])}\n"
        f"Recent Pushes: {', '.join(p['repo'] + ' (' + (p['pushed_at'] or 'N/A') + ')' for p in github_data['recent_pushes'])}\n\n"
        "Based on this data, return a JSON object with exactly these keys:\n"
        "{\n"
        '  "overall_score": <number 0-100 rating their GitHub presence>,\n'
        '  "summary": "<2-3 sentence overview of their profile strength>",\n'
        '  "improvements": ["<improvement 1>", "<improvement 2>", ...],\n'
        '  "strengths": ["<strength 1>", "<strength 2>", ...]\n'
        "}\n"
        "Provide 4-6 specific, actionable improvements and 3-4 strengths. "
        "Be specific — reference their actual languages, repo count, and activity level."
    )

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a senior developer career coach. Analyze GitHub profiles and give concrete, actionable advice to improve developer presence and skills."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.4,
            max_tokens=800,
        )
        analysis = json.loads(response.choices[0].message.content or "{}")
    except Exception as e:
        print(f"[GitHub Profile] Groq error: {e}")
        analysis = None

    return jsonify({
        "github": github_data,
        "analysis": analysis,
    })
