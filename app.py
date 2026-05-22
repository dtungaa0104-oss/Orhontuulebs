from flask import Flask, render_template, request, jsonify, send_file
import json
import os
import random
import io

app = Flask(__name__)

# ─── Жишиг өгөгдөл ──────────────────────────────────────────────────────────

SUBJECTS = {
    "1-5": ["Монгол хэл", "Математик", "Байгалийн ухаан", "Нийгэм судлал"],
    "6-9": ["Монгол хэл", "Монгол уран зохиол", "Математик", "Физик", "Хими", "Биологи", "Газарзүй", "Түүх", "Англи хэл"],
    "10-12": ["Монгол хэл", "Монгол уран зохиол", "Математик", "Физик", "Хими", "Биологи", "Газарзүй", "Түүх", "Англи хэл", "Нийгмийн ухаан"]
}

DIFFICULTY = ["Хялбар", "Дунд", "Хүнд"]
BLOOM = ["Мэдлэг", "Ойлголт", "Хэрэглээ", "Шинжилгээ", "Үнэлгээ", "Бүтээл"]
EXAM_TYPES = ["Улсын шалгалт", "Анги дэвших шалгалт", "Дотоод шалгалт"]

def generate_questions(grade, subject, count=20):
    """Sample question generator — replace with real DB later"""
    questions = []
    for i in range(1, count + 1):
        diff = random.choice(DIFFICULTY)
        bloom = random.choice(BLOOM)
        q = {
            "id": f"Q{grade}-{subject[:3]}-{i:03d}",
            "grade": grade,
            "subject": subject,
            "difficulty": diff,
            "bloom": bloom,
            "type": random.choice(["Нэг сонголт", "Олон сонголт", "Нээлттэй"]),
            "question": f"{subject} хичээлийн {grade}-р анги, {diff} түвшний {i}-р даалгавар. ({bloom} шатны асуулт)",
            "options": [f"А. Хариулт {i}а", f"Б. Хариулт {i}б", f"В. Хариулт {i}в", f"Г. Хариулт {i}г"] if random.random() > 0.2 else None,
            "answer": "А",
            "score": 1 if diff == "Хялбар" else (2 if diff == "Дунд" else 3),
            "topic": f"Сэдэв {random.randint(1, 8)}"
        }
        questions.append(q)
    return questions

# ─── Routes ─────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html", subjects=SUBJECTS, exam_types=EXAM_TYPES)

@app.route("/questions")
def questions_page():
    return render_template("questions.html", subjects=SUBJECTS, difficulties=DIFFICULTY, blooms=BLOOM, exam_types=EXAM_TYPES)

@app.route("/blueprint")
def blueprint_page():
    return render_template("blueprint.html", subjects=SUBJECTS, exam_types=EXAM_TYPES, blooms=BLOOM, difficulties=DIFFICULTY)

@app.route("/api/questions")
def api_questions():
    grade = int(request.args.get("grade", 9))
    subject = request.args.get("subject", "Математик")
    difficulty = request.args.get("difficulty", "all")
    bloom = request.args.get("bloom", "all")
    count = int(request.args.get("count", 20))

    questions = generate_questions(grade, subject, 50)

    if difficulty != "all":
        questions = [q for q in questions if q["difficulty"] == difficulty]
    if bloom != "all":
        questions = [q for q in questions if q["bloom"] == bloom]

    questions = questions[:count]
    return jsonify({"questions": questions, "total": len(questions)})

@app.route("/api/generate-exam", methods=["POST"])
def generate_exam():
    data = request.json
    grade = data.get("grade", 9)
    subject = data.get("subject", "Математик")
    exam_type = data.get("exam_type", "Улсын шалгалт")
    blueprint = data.get("blueprint", {})

    all_questions = generate_questions(grade, subject, 60)
    selected = []

    if blueprint:
        for diff, cnt in blueprint.items():
            pool = [q for q in all_questions if q["difficulty"] == diff]
            selected.extend(random.sample(pool, min(int(cnt), len(pool))))
    else:
        count = 40 if exam_type == "Улсын шалгалт" else 25
        selected = random.sample(all_questions, min(count, len(all_questions)))

    exam = {
        "title": f"{grade}-р ангийн {subject} хичээлийн {exam_type}",
        "grade": grade,
        "subject": subject,
        "exam_type": exam_type,
        "total_questions": len(selected),
        "total_score": sum(q["score"] for q in selected),
        "duration": "90 минут" if exam_type == "Улсын шалгалт" else "60 минут",
        "questions": selected
    }
    return jsonify(exam)

@app.route("/api/stats")
def stats():
    return jsonify({
        "total_questions": 4820,
        "grades": 12,
        "subjects": 10,
        "blueprints": 36
    })

if __name__ == "__main__":
   import os
port = int(os.environ.get("PORT", 5000))
app.run(host="0.0.0.0", port=port)
