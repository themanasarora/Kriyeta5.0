import os
import json
import requests
from flask import Blueprint, request, jsonify
from groq import Groq

leetcode_profile_bp = Blueprint('leetcode_profile', __name__)

LEETCODE_GRAPHQL = "https://leetcode.com/graphql"


@leetcode_profile_bp.route('/leetcode-profile', methods=['POST'])
def analyze_leetcode_profile():
    """
    Accepts { "username": "..." }
    1. Fetches problem stats, contest info, and language usage from LeetCode GraphQL API
    2. Sends that data to Groq for improvement suggestions
    """
    data = request.get_json()
    if not data or not data.get("username"):
        return jsonify({"error": "LeetCode username is required"}), 400

    username = data["username"].strip()

    headers = {
        "Content-Type": "application/json",
        "Referer": "https://leetcode.com",
    }

    # ── 1. Fetch user profile ─────────────────────────────────────
    profile_query = {
        "query": """
        query getUserProfile($username: String!) {
            matchedUser(username: $username) {
                username
                profile {
                    realName
                    aboutMe
                    ranking
                    reputation
                    starRating
                }
                submitStatsGlobal {
                    acSubmissionNum {
                        difficulty
                        count
                        submissions
                    }
                }
                tagProblemCounts {
                    advanced {
                        tagName
                        problemsSolved
                    }
                    intermediate {
                        tagName
                        problemsSolved
                    }
                    fundamental {
                        tagName
                        problemsSolved
                    }
                }
                languageProblemCount {
                    languageName
                    problemsSolved
                }
            }
        }
        """,
        "variables": {"username": username}
    }

    try:
        resp = requests.post(LEETCODE_GRAPHQL, json=profile_query, headers=headers, timeout=15)
        result = resp.json()
    except Exception as e:
        return jsonify({"error": f"Failed to reach LeetCode API: {str(e)}"}), 502

    matched = result.get("data", {}).get("matchedUser")
    if not matched:
        return jsonify({"error": f"LeetCode user '{username}' not found"}), 404

    # Parse submission stats
    sub_stats = matched.get("submitStatsGlobal", {}).get("acSubmissionNum", [])
    problems = {"All": 0, "Easy": 0, "Medium": 0, "Hard": 0}
    for s in sub_stats:
        diff = s.get("difficulty", "")
        problems[diff] = s.get("count", 0)

    # Parse languages
    lang_stats = matched.get("languageProblemCount", []) or []
    languages = sorted(lang_stats, key=lambda x: x.get("problemsSolved", 0), reverse=True)

    # Parse top tags
    tag_counts = []
    for level in ["fundamental", "intermediate", "advanced"]:
        for tag in (matched.get("tagProblemCounts", {}).get(level, []) or []):
            tag_counts.append({"tag": tag["tagName"], "count": tag["problemsSolved"]})
    top_tags = sorted(tag_counts, key=lambda x: x["count"], reverse=True)[:10]

    profile = matched.get("profile", {})

    leetcode_data = {
        "username": matched.get("username", username),
        "real_name": profile.get("realName", ""),
        "ranking": profile.get("ranking", 0),
        "reputation": profile.get("reputation", 0),
        "total_solved": problems.get("All", 0),
        "easy_solved": problems.get("Easy", 0),
        "medium_solved": problems.get("Medium", 0),
        "hard_solved": problems.get("Hard", 0),
        "languages": [{"language": l["languageName"], "count": l["problemsSolved"]} for l in languages[:8]],
        "top_tags": top_tags,
    }

    # ── 2. Determine activeness ───────────────────────────────────
    total = leetcode_data["total_solved"]
    if total >= 500:
        activeness = "Very Active"
    elif total >= 200:
        activeness = "Active"
    elif total >= 50:
        activeness = "Moderately Active"
    elif total >= 10:
        activeness = "Low Activity"
    else:
        activeness = "Beginner"
    leetcode_data["activeness"] = activeness

    # ── 3. Send to Groq for analysis ─────────────────────────────
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return jsonify({"leetcode": leetcode_data, "analysis": None, "error_detail": "GROQ_API_KEY not set"})

    client = Groq(api_key=api_key)

    prompt = (
        f"Analyze this LeetCode developer profile and provide actionable improvement suggestions.\n\n"
        f"Developer: {leetcode_data['real_name'] or leetcode_data['username']} ({leetcode_data['username']})\n"
        f"Global Ranking: {leetcode_data['ranking']}\n"
        f"Total Problems Solved: {leetcode_data['total_solved']}\n"
        f"  - Easy: {leetcode_data['easy_solved']}\n"
        f"  - Medium: {leetcode_data['medium_solved']}\n"
        f"  - Hard: {leetcode_data['hard_solved']}\n"
        f"Activeness: {leetcode_data['activeness']}\n"
        f"Languages Used: {', '.join(l['language'] + ' (' + str(l['count']) + ' problems)' for l in leetcode_data['languages'][:6])}\n"
        f"Top Topic Tags: {', '.join(t['tag'] + ' (' + str(t['count']) + ')' for t in leetcode_data['top_tags'][:8])}\n\n"
        "Based on this data, return a JSON object with exactly these keys:\n"
        "{\n"
        '  "overall_score": <number 0-100 rating their coding profile>,\n'
        '  "summary": "<2-3 sentence overview of their LeetCode profile>",\n'
        '  "improvements": ["<improvement 1>", "<improvement 2>", ...],\n'
        '  "strengths": ["<strength 1>", "<strength 2>", ...]\n'
        "}\n"
        "Provide 4-6 specific improvements and 3-4 strengths. "
        "Reference their actual problem counts, difficulty distribution, languages, and weak topic areas."
    )

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a competitive programming coach. Analyze LeetCode profiles and give concrete advice to improve problem-solving skills and interview readiness."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.4,
            max_tokens=800,
        )
        analysis = json.loads(response.choices[0].message.content or "{}")
    except Exception as e:
        print(f"[LeetCode Profile] Groq error: {e}")
        analysis = None

    return jsonify({
        "leetcode": leetcode_data,
        "analysis": analysis,
    })
