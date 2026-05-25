from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import os
import sqlite3
from datetime import datetime
from functools import wraps

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "orkhontul-ebs-2025-secret")
DB_PATH = os.environ.get("DB_PATH", "questions.db")

# ── Мэдээллийн сан ────────────────────────────────────────────────────────────

SUBJECTS = {
    "1-5":   ["Монгол хэл", "Математик"],
    "6-9":   ["Монгол хэл", "Монгол уран зохиол", "Математик", "Физик",
              "Хими", "Биологи", "Газарзүй", "Түүх", "Англи хэл"],
    "10-12": ["Монгол хэл", "Монгол уран зохиол", "Математик", "Физик",
              "Хими", "Биологи", "Газарзүй", "Түүх", "Англи хэл", "Нийгмийн ухаан"]
}

DIFFICULTY = ["Хялбар", "Дунд", "Хүнд"]
BLOOM      = ["Мэдлэг", "Ойлголт", "Хэрэглээ", "Шинжилгээ", "Үнэлгээ", "Бүтээл"]
Q_TYPES    = ["Нэг сонголт", "Олон сонголт", "Нээлттэй"]

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "orkhontul2025")

# ── Шалгалтын төрлүүд ─────────────────────────────────────────────────────────

EXAM_TYPES = {
    "guitsegdel": {
        "name":   "Гүйцэтгэлийн үнэлгээ",
        "icon":   "📝",
        "color":  "#4CAF50",
        "grades": list(range(1, 10)),
        "desc":   "1–9-р ангийн жилийн эцсийн гүйцэтгэлийн үнэлгээ. Оноогоор дүгнэхгүй.",
        "blueprint": {
            "duration": "60 минут",
            "total":    25,
            "score":    0,
            "note":     "Оноогоор дүгнэхгүй",
            "Хялбар":   10,
            "Дунд":     10,
            "Хүнд":     5,
        }
    },
    "angi_devshikh": {
        "name":   "Анги дэвших шалгалт",
        "icon":   "🎯",
        "color":  "#2196F3",
        "grades": list(range(1, 10)),
        "desc":   "1–9-р ангийн анги дэвших шалгалт. Тест болон нээлттэй даалгавар.",
        "blueprint": {
            "duration": "60 минут",
            "total":    30,
            "score":    50,
            "note":     "",
            "Хялбар":   15,
            "Дунд":     10,
            "Хүнд":     5,
        }
    },
    "ulsiin": {
        "name":   "Улсын шалгалт",
        "icon":   "🏛",
        "color":  "#9C27B0",
        "grades": [9, 12],
        "desc":   "9, 12-р ангийн улсын төгсөлтийн шалгалт.",
        "blueprint": {
            "duration": "90 минут",
            "total":    40,
            "score":    60,
            "note":     "",
            "Хялбар":   15,
            "Дунд":     15,
            "Хүнд":     10,
        }
    },
    "elselt": {
        "name":   "Элсэлтийн шалгалт",
        "icon":   "🎓",
        "color":  "#FF5722",
        "grades": [12],
        "desc":   "12-р ангийн их, дээд сургуульд элсэх шалгалт. −0.2 оноо.",
        "blueprint": {
            "duration": "90 минут",
            "total":    60,
            "score":    100,
            "note":     "1 буруу = −0.2 оноо",
            "Хялбар":   20,
            "Дунд":     25,
            "Хүнд":     15,
        }
    },
}

# Анги → шалгалтын төрөл харьцаа
GRADE_EXAM_MAP = {}
for g in range(1, 10):
    GRADE_EXAM_MAP[g] = "angi_devshikh"
GRADE_EXAM_MAP[9]  = "ulsiin"
GRADE_EXAM_MAP[12] = "elselt"
for g in [10, 11]:
    GRADE_EXAM_MAP[g] = "ulsiin"

# ── DB ────────────────────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            q_code TEXT UNIQUE,
            grade INTEGER NOT NULL,
            subject TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            bloom TEXT NOT NULL,
            q_type TEXT NOT NULL,
            question TEXT NOT NULL,
            option_a TEXT,
            option_b TEXT,
            option_c TEXT,
            option_d TEXT,
            answer TEXT,
            score INTEGER DEFAULT 1,
            topic TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

# ── Auth ──────────────────────────────────────────────────────────────────────

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("admin"):
            return redirect(url_for("admin_login"))
        return f(*args, **kwargs)
    return decorated

# ── Helpers ───────────────────────────────────────────────────────────────────

def row_to_dict(row):
    d = dict(row)
    if d.get("option_a"):
        d["options"] = [
            f"А. {d['option_a']}", f"Б. {d['option_b']}",
            f"В. {d['option_c']}", f"Г. {d['option_d']}"
        ]
    else:
        d["options"] = None
    return d

# ── Public routes ─────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html",
                           subjects=SUBJECTS,
                           exam_types=EXAM_TYPES,
                           grade_exam_map=GRADE_EXAM_MAP)

@app.route("/questions")
def questions_page():
    return render_template("questions.html",
                           subjects=SUBJECTS,
                           difficulties=DIFFICULTY,
                           blooms=BLOOM)

@app.route("/blueprint")
def blueprint_page():
    return render_template("blueprint.html",
                           subjects=SUBJECTS,
                           exam_types=EXAM_TYPES,
                           grade_exam_map=GRADE_EXAM_MAP,
                           blooms=BLOOM,
                           difficulties=DIFFICULTY)

# ── API ───────────────────────────────────────────────────────────────────────

@app.route("/api/questions")
def api_questions():
    grade      = request.args.get("grade", "")
    subject    = request.args.get("subject", "")
    difficulty = request.args.get("difficulty", "all")
    bloom      = request.args.get("bloom", "all")
    count      = int(request.args.get("count", 20))

    conn = get_db()
    sql  = "SELECT * FROM questions WHERE 1=1"
    params = []
    if grade:                sql += " AND grade=?";      params.append(int(grade))
    if subject:              sql += " AND subject=?";    params.append(subject)
    if difficulty != "all":  sql += " AND difficulty=?"; params.append(difficulty)
    if bloom != "all":       sql += " AND bloom=?";      params.append(bloom)
    sql += " ORDER BY RANDOM() LIMIT ?";  params.append(count)

    rows = conn.execute(sql, params).fetchall()
    conn.close()
    questions = [row_to_dict(r) for r in rows]
    return jsonify({"questions": questions, "total": len(questions)})


@app.route("/api/generate-exam", methods=["POST"])
def generate_exam():
    data      = request.json
    grade     = data.get("grade", 9)
    subject   = data.get("subject", "Математик")
    exam_id   = data.get("exam_id", "angi_devshikh")
    blueprint = data.get("blueprint", {})

    et = EXAM_TYPES.get(exam_id, EXAM_TYPES["angi_devshikh"])

    conn     = get_db()
    selected = []
    if blueprint:
        for diff, cnt in blueprint.items():
            if cnt <= 0:
                continue
            rows = conn.execute(
                "SELECT * FROM questions WHERE grade=? AND subject=? AND difficulty=?"
                " ORDER BY RANDOM() LIMIT ?",
                (grade, subject, diff, int(cnt))
            ).fetchall()
            selected.extend([row_to_dict(r) for r in rows])
    else:
        limit = et["blueprint"]["total"]
        rows  = conn.execute(
            "SELECT * FROM questions WHERE grade=? AND subject=? ORDER BY RANDOM() LIMIT ?",
            (grade, subject, limit)
        ).fetchall()
        selected = [row_to_dict(r) for r in rows]
    conn.close()

    is_guitsegdel = exam_id == "guitsegdel"
    exam = {
        "title":           f"{grade}-р ангийн {subject} — {et['name']}",
        "grade":           grade,
        "subject":         subject,
        "exam_id":         exam_id,
        "exam_type":       et["name"],
        "exam_icon":       et["icon"],
        "total_questions": len(selected),
        "total_score":     0 if is_guitsegdel else sum(q["score"] for q in selected),
        "duration":        et["blueprint"]["duration"],
        "note":            et["blueprint"].get("note", ""),
        "questions":       selected,
    }
    return jsonify(exam)


@app.route("/api/stats")
def stats():
    conn     = get_db()
    total    = conn.execute("SELECT COUNT(*) FROM questions").fetchone()[0]
    grades   = conn.execute("SELECT COUNT(DISTINCT grade) FROM questions").fetchone()[0]
    subjects = conn.execute("SELECT COUNT(DISTINCT subject) FROM questions").fetchone()[0]
    conn.close()
    return jsonify({"total_questions": total or 0,
                    "grades": grades or 12,
                    "subjects": subjects or 10,
                    "blueprints": 36})


# ── AI Generate route ─────────────────────────────────────────────────────────

@app.route("/api/save-question", methods=["POST"])
def save_question():
    """AI үүсгэсэн даалгаврыг мэдээллийн санд хадгалах."""
    data = request.json
    try:
        grade   = int(data.get("grade", 1))
        subject = data.get("subject", "")
        diff    = data.get("difficulty", "Дунд")
        q_code  = f"AI-Q{grade}-{subject[:3]}-{datetime.now().strftime('%H%M%S%f')}"
        score   = data.get("score") or (1 if diff == "Хялбар" else (2 if diff == "Дунд" else 3))

        conn = get_db()
        conn.execute("""
            INSERT INTO questions
            (q_code, grade, subject, difficulty, bloom, q_type, question,
             option_a, option_b, option_c, option_d, answer, score, topic)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            q_code, grade, subject, diff,
            data.get("bloom", "Мэдлэг"),
            data.get("q_type", "Нэг сонголт"),
            data.get("question", ""),
            data.get("option_a"), data.get("option_b"),
            data.get("option_c"), data.get("option_d"),
            data.get("answer", ""),
            int(score),
            data.get("topic", "")
        ))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "q_code": q_code})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


# ── Admin ─────────────────────────────────────────────────────────────────────

@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    error = None
    if request.method == "POST":
        if request.form.get("password") == ADMIN_PASSWORD:
            session["admin"] = True
            return redirect(url_for("admin_dashboard"))
        error = "Нууц үг буруу байна!"
    return render_template("admin_login.html", error=error)

@app.route("/admin/logout")
def admin_logout():
    session.pop("admin", None)
    return redirect(url_for("admin_login"))

@app.route("/admin")
@login_required
def admin_dashboard():
    conn    = get_db()
    total   = conn.execute("SELECT COUNT(*) FROM questions").fetchone()[0]
    by_diff = conn.execute("SELECT difficulty, COUNT(*) as cnt FROM questions GROUP BY difficulty").fetchall()
    by_sub  = conn.execute("SELECT subject, COUNT(*) as cnt FROM questions GROUP BY subject ORDER BY cnt DESC").fetchall()
    recent  = conn.execute("SELECT * FROM questions ORDER BY id DESC LIMIT 8").fetchall()
    conn.close()
    return render_template("admin_dashboard.html",
                           total=total, by_diff=by_diff, by_sub=by_sub, recent=recent,
                           subjects=SUBJECTS, difficulties=DIFFICULTY, blooms=BLOOM, q_types=Q_TYPES)

@app.route("/admin/add", methods=["GET", "POST"])
@login_required
def admin_add():
    if request.method == "POST":
        f      = request.form
        grade  = int(f["grade"])
        subject = f["subject"]
        diff   = f["difficulty"]
        q_code = f"Q{grade}-{subject[:3]}-{datetime.now().strftime('%H%M%S%f')}"
        score  = 1 if diff == "Хялбар" else (2 if diff == "Дунд" else 3)
        conn   = get_db()
        conn.execute("""
            INSERT INTO questions
            (q_code,grade,subject,difficulty,bloom,q_type,question,
             option_a,option_b,option_c,option_d,answer,score,topic)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (q_code, grade, subject, diff, f["bloom"], f["q_type"], f["question"],
              f.get("option_a"), f.get("option_b"), f.get("option_c"), f.get("option_d"),
              f.get("answer"), score, f.get("topic", "")))
        conn.commit()
        conn.close()
        return redirect(url_for("admin_list"))
    return render_template("admin_add.html",
                           subjects=SUBJECTS, difficulties=DIFFICULTY,
                           blooms=BLOOM, q_types=Q_TYPES)

@app.route("/admin/list")
@login_required
def admin_list():
    grade   = request.args.get("grade", "")
    subject = request.args.get("subject", "")
    diff    = request.args.get("difficulty", "")
    conn    = get_db()
    sql     = "SELECT * FROM questions WHERE 1=1"
    params  = []
    if grade:   sql += " AND grade=?";      params.append(int(grade))
    if subject: sql += " AND subject=?";    params.append(subject)
    if diff:    sql += " AND difficulty=?"; params.append(diff)
    sql += " ORDER BY id DESC"
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return render_template("admin_list.html", questions=rows,
                           subjects=SUBJECTS, difficulties=DIFFICULTY,
                           sel_grade=grade, sel_subject=subject, sel_diff=diff)

@app.route("/admin/delete/<int:qid>", methods=["POST"])
@login_required
def admin_delete(qid):
    conn = get_db()
    conn.execute("DELETE FROM questions WHERE id=?", (qid,))
    conn.commit()
    conn.close()
    return redirect(url_for("admin_list"))

@app.route("/admin/edit/<int:qid>", methods=["GET", "POST"])
@login_required
def admin_edit(qid):
    conn = get_db()
    if request.method == "POST":
        f     = request.form
        score = 1 if f["difficulty"] == "Хялбар" else (2 if f["difficulty"] == "Дунд" else 3)
        conn.execute("""
            UPDATE questions
            SET grade=?,subject=?,difficulty=?,bloom=?,q_type=?,question=?,
                option_a=?,option_b=?,option_c=?,option_d=?,answer=?,score=?,topic=?
            WHERE id=?
        """, (int(f["grade"]), f["subject"], f["difficulty"], f["bloom"], f["q_type"],
              f["question"], f.get("option_a"), f.get("option_b"), f.get("option_c"),
              f.get("option_d"), f.get("answer"), score, f.get("topic", ""), qid))
        conn.commit()
        conn.close()
        return redirect(url_for("admin_list"))
    q = conn.execute("SELECT * FROM questions WHERE id=?", (qid,)).fetchone()
    conn.close()
    return render_template("admin_add.html", q=q,
                           subjects=SUBJECTS, difficulties=DIFFICULTY,
                           blooms=BLOOM, q_types=Q_TYPES)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
