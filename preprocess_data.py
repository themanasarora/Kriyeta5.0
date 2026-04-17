import pandas as pd
import json
import os
import re

def clean_text(text):
    if not isinstance(text, str):
        return ""
    # Remove HTML tags if any (observed in Resume.csv peek)
    text = re.sub(r'<[^>]+>', ' ', text)
    # Remove multiple whitespaces and newlines
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def preprocess():
    data_dir = 'data'
    corpus = []

    # 1. Process Resume.csv
    csv_path = os.path.join(data_dir, 'Resume.csv')
    if os.path.exists(csv_path):
        print(f"Processing {csv_path}...")
        df = pd.read_csv(csv_path)
        if 'Resume_str' in df.columns:
            resumes = df['Resume_str'].dropna().apply(clean_text).tolist()
            corpus.extend(resumes)
            print(f"Added {len(resumes)} entries from CSV.")
    
    # 2. Process Entity Recognition in Resumes.json
    json_path = os.path.join(data_dir, 'Entity Recognition in Resumes.json')
    if os.path.exists(json_path):
        print(f"Processing {json_path}...")
        with open(json_path, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    data = json.loads(line)
                    content = data.get('content', '')
                    cleaned = clean_text(content)
                    if cleaned:
                        corpus.append(cleaned)
                except json.JSONDecodeError:
                    continue
        print(f"Finished processing JSON. Total corpus size: {len(corpus)}")

    # Save corpus for training
    os.makedirs('processed', exist_ok=True)
    with open('processed/training_corpus.txt', 'w', encoding='utf-8') as f:
        for text in corpus:
            f.write(text + '\n')
    
    print("Preprocessed data saved to processed/training_corpus.txt")

if __name__ == "__main__":
    preprocess()
