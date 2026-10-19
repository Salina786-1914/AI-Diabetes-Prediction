
import json
import re
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


BASE_DIR = Path(__file__).resolve().parent
FAQ_PATH = BASE_DIR / "health_faqs.json"

with open(FAQ_PATH, "r", encoding="utf-8") as file:
    faqs = json.load(file)


# Include both questions and answers to help match related wording.
faq_texts = [
    f"{faq['question']} {faq['answer']}"
    for faq in faqs
]

vectorizer = TfidfVectorizer(
    lowercase=True,
    ngram_range=(1, 2),
    strip_accents="unicode"
)

faq_vectors = vectorizer.fit_transform(faq_texts)


def normalize_text(text):
    """Normalize text while preserving Hindi and Marathi characters."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", " ", text, flags=re.UNICODE)
    text = re.sub(r"\s+", " ", text)
    return text


def ask_health_assistant(question):
    question = normalize_text(question)

    if not question:
        return {
            "answer": "Please enter a question.",
            "language": "en",
            "matched_question": None,
            "similarity": 0.0
        }

    # Compare the user's question with FAQ questions.
    question_texts = [
        normalize_text(faq["question"])
        for faq in faqs
    ]

    question_vectorizer = TfidfVectorizer(
        lowercase=True,
        ngram_range=(1, 2),
        strip_accents="unicode"
    )

    question_vectors = question_vectorizer.fit_transform(
        question_texts + [question]
    )

    similarities = cosine_similarity(
        question_vectors[-1],
        question_vectors[:-1]
    )[0]

    best_index = int(similarities.argmax())
    best_score = float(similarities[best_index])
    best_faq = faqs[best_index]

    # Avoid returning an unrelated answer when matching is weak.
    if best_score < 0.10:
        return {
            "answer": (
                "Sorry, I could not find a suitable answer. "
                "Try asking about diabetes, blood sugar, BMI "
                "or blood pressure. / "
                "माफ करा, योग्य उत्तर सापडले नाही. / "
                "माफ़ कीजिए, सही जवाब नहीं मिला।"
            ),
            "language": "unknown",
            "matched_question": None,
            "similarity": round(best_score, 3)
        }

    return {
        "answer": best_faq["answer"],
        "language": best_faq.get("language", "en"),
        "matched_question": best_faq["question"],
        "similarity": round(best_score, 3)
    }


if __name__ == "__main__":
    print("Multilingual Health FAQ Assistant")
    print("English, Hindi, Marathi")
    print("Type 'exit' to stop.\n")

    while True:
        user_question = input("You: ")

        if user_question.strip().lower() == "exit":
            break

        result = ask_health_assistant(user_question)

        print("Matched FAQ:", result["matched_question"])
        print("Language:", result["language"])
        print("Match score:", result["similarity"])
        print("Answer:", result["answer"])
        print("-" * 50)
