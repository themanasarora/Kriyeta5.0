import re
import numpy as np
from flask import Blueprint, request, jsonify
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

confidence_bp = Blueprint('confidence', __name__)

# ─── Linguistic feature constants ─────────────────────────────────────────────

# Hedging phrases that strongly signal low confidence
HEDGE_PATTERNS = [
    r"\bi think\b", r"\bi believe\b", r"\bmaybe\b", r"\bperhaps\b",
    r"\bprobably\b", r"\bsort of\b", r"\bkind of\b", r"\bi guess\b",
    r"\bnot sure\b", r"\bi mean\b", r"\bit seems\b", r"\bapparently\b",
    r"\bsomewhat\b", r"\bi suppose\b", r"\bi\'m not sure\b", r"\bif i recall\b",
    r"\bif i remember\b", r"\bmore or less\b", r"\baround\b", r"\bbasically\b",
]

# Confident assertion phrases — positive signal
CONFIDENT_PATTERNS = [
    r"\bI have\b", r"\bI did\b", r"\bI built\b", r"\bI implemented\b",
    r"\bI designed\b", r"\bI led\b", r"\bI achieved\b", r"\bI improved\b",
    r"\bI ensured\b", r"\bspecifically\b", r"\bconcretely\b", r"\bfor example\b",
    r"\bin my experience\b", r"\bthe result was\b", r"\bthe outcome\b",
]

# ─── Synthetic training data ───────────────────────────────────────────────────
# Features: [hedge_ratio, filler_ratio, vocab_richness, avg_sent_len,
#            word_count_norm, confident_ratio]
# Labels: 0 = Low, 1 = Moderate, 2 = High

_X_TRAIN = np.array([
    # ── LOW confidence ────────────────────────────────────────────────────────
    [0.10, 0.14, 0.40, 4.5,  0.10, 0.00],
    [0.09, 0.16, 0.38, 4.0,  0.12, 0.00],
    [0.12, 0.12, 0.42, 3.8,  0.08, 0.01],
    [0.11, 0.20, 0.36, 3.5,  0.09, 0.00],
    [0.13, 0.10, 0.39, 4.2,  0.11, 0.01],
    [0.08, 0.18, 0.37, 3.0,  0.07, 0.00],
    [0.10, 0.15, 0.41, 4.6,  0.13, 0.01],
    [0.14, 0.13, 0.35, 3.9,  0.10, 0.00],
    [0.09, 0.17, 0.43, 4.1,  0.06, 0.00],
    [0.12, 0.11, 0.38, 3.7,  0.14, 0.01],

    # ── MODERATE confidence ───────────────────────────────────────────────────
    [0.04, 0.06, 0.55, 8.5,  0.50, 0.02],
    [0.05, 0.05, 0.58, 9.0,  0.55, 0.03],
    [0.03, 0.07, 0.52, 7.5,  0.45, 0.02],
    [0.06, 0.04, 0.56, 8.0,  0.48, 0.03],
    [0.04, 0.08, 0.54, 7.0,  0.52, 0.02],
    [0.05, 0.06, 0.57, 8.5,  0.42, 0.03],
    [0.03, 0.05, 0.53, 9.0,  0.60, 0.04],
    [0.06, 0.07, 0.51, 7.8,  0.50, 0.02],
    [0.04, 0.06, 0.55, 8.2,  0.47, 0.03],
    [0.05, 0.05, 0.59, 8.8,  0.53, 0.04],

    # ── HIGH confidence ───────────────────────────────────────────────────────
    [0.01, 0.01, 0.70, 14.0, 0.85, 0.06],
    [0.00, 0.02, 0.72, 15.0, 0.90, 0.07],
    [0.01, 0.00, 0.68, 13.0, 0.80, 0.08],
    [0.02, 0.01, 0.71, 16.0, 0.88, 0.06],
    [0.00, 0.02, 0.73, 14.5, 0.92, 0.09],
    [0.01, 0.01, 0.69, 15.5, 0.78, 0.07],
    [0.02, 0.00, 0.74, 13.5, 0.82, 0.08],
    [0.01, 0.02, 0.70, 14.0, 0.86, 0.06],
    [0.00, 0.01, 0.75, 15.0, 0.91, 0.10],
    [0.01, 0.00, 0.71, 14.8, 0.84, 0.09],
])

_Y_TRAIN = np.array(
    [0] * 10 +   # Low
    [1] * 10 +   # Moderate
    [2] * 10     # High
)

LABEL_MAP = {0: 'Low', 1: 'Moderate', 2: 'High'}

# ─── Build & pre-train model once at import time ──────────────────────────────

def _build_model():
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(_X_TRAIN)
    model = LogisticRegression(
        random_state=42, max_iter=2000, solver='lbfgs'
    )
    model.fit(X_scaled, _Y_TRAIN)
    return model, scaler

_MODEL, _SCALER = _build_model()

# ─── Feature extraction ────────────────────────────────────────────────────────

def _extract_features(transcript: str, filler_count: int) -> list:
    """
    Returns a 6-element feature vector:
      [hedge_ratio, filler_ratio, vocab_richness,
       avg_sentence_len, word_count_norm, confident_ratio]
    """
    text = transcript.strip()
    if not text or len(text) < 5:
        return [0.12, 0.15, 0.38, 3.5, 0.05, 0.00]

    lowered = text.lower()
    words   = re.findall(r"\b\w+\b", lowered)
    total   = max(len(words), 1)

    # 1. Hedging ratio
    hedge_count = sum(
        len(re.findall(pat, lowered)) for pat in HEDGE_PATTERNS
    )
    hedge_ratio = min(hedge_count / total, 0.25)

    # 2. Filler ratio
    filler_ratio = min(filler_count / total, 0.25)

    # 3. Vocabulary richness (Type-Token Ratio)
    vocab_richness = len(set(words)) / total

    # 4. Average sentence length (words per sentence)
    sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
    avg_sent_len = total / max(len(sentences), 1)

    # 5. Word-count normalised (target ~150 words for maximum score)
    word_count_norm = min(total / 150.0, 1.0)

    # 6. Confident assertion ratio
    confident_count = sum(
        len(re.findall(pat, text, re.IGNORECASE)) for pat in CONFIDENT_PATTERNS
    )
    confident_ratio = min(confident_count / total, 0.15)

    return [hedge_ratio, filler_ratio, vocab_richness,
            avg_sent_len, word_count_norm, confident_ratio]


def _build_breakdown(features: list) -> dict:
    hedge_ratio, filler_ratio, vocab_richness, avg_sent_len, _, confident_ratio = features

    hedging   = "High"     if hedge_ratio   > 0.06 else ("Moderate" if hedge_ratio   > 0.02 else "Low")
    fluency   = "Poor"     if filler_ratio  > 0.10 else ("Fair"     if filler_ratio  > 0.04 else "Good")
    vocab     = "Rich"     if vocab_richness > 0.65 else ("Moderate" if vocab_richness > 0.50 else "Limited")
    structure = "Strong"   if avg_sent_len  > 12.0 else ("Moderate" if avg_sent_len  > 7.0  else "Minimal")
    assertion = "Assertive" if confident_ratio > 0.05 else ("Neutral" if confident_ratio > 0.02 else "Tentative")

    return {
        "hedging":   hedging,
        "fluency":   fluency,
        "vocabulary": vocab,
        "structure": structure,
        "assertion": assertion,
    }


# ─── API Route ─────────────────────────────────────────────────────────────────

@confidence_bp.route('/score-confidence', methods=['POST'])
def score_confidence():
    """
    POST body: { transcript: str, filler_count: int }
    Returns:   { confidence_score: int, label: str, breakdown: dict }
    """
    body        = request.get_json(force=True) or {}
    transcript  = body.get('transcript', '')
    filler_count = int(body.get('filler_count', 0))

    # Short / empty answer — direct low score
    word_count = len(re.findall(r"\b\w+\b", transcript))
    if not transcript.strip() or word_count < 6:
        return jsonify({
            'confidence_score': 22,
            'label': 'Low',
            'breakdown': {
                'hedging': 'N/A', 'fluency': 'No Speech',
                'vocabulary': 'N/A', 'structure': 'N/A', 'assertion': 'Tentative',
            }
        })

    features = _extract_features(transcript, filler_count)

    X        = np.array([features])
    X_scaled = _SCALER.transform(X)

    pred_class = int(_MODEL.predict(X_scaled)[0])
    pred_proba = _MODEL.predict_proba(X_scaled)[0]

    # Weighted centre for each class
    base_scores = [22, 55, 85]
    raw_score   = float(np.dot(pred_proba, base_scores))

    # Fine-grained adjustment from raw feature values
    hedge_ratio, filler_ratio, vocab_richness, avg_sent_len, _, confident_ratio = features
    adjustment = (
        - hedge_ratio     * 80   # up to -20 pts for heavy hedging
        - filler_ratio    * 50   # up to -12 pts for heavy fillers
        + (vocab_richness - 0.5) * 30  # ±9 pts for vocab
        + confident_ratio * 60   # up to +9 pts for assertive phrases
    )

    confidence_score = int(max(0, min(100, raw_score + adjustment)))
    label            = LABEL_MAP[pred_class]
    breakdown        = _build_breakdown(features)

    return jsonify({
        'confidence_score': confidence_score,
        'label':            label,
        'breakdown':        breakdown,
    })
