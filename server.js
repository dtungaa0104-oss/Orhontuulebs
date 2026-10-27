const express = require("express");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("./db");
const { SUBJECTS, QUESTIONS } = require("./data/questions");
const VOCAB = require("./data/vocab");

const app = express();
app.use(express.json({ limit: "200kb" }));
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

const PORT = process.env.PORT || 3000;
const TEACHER_INVITE_CODE = process.env.TEACHER_INVITE_CODE || ""; // хоосон бол хэн ч багшаар бүртгүүлнэ
const APP_TZ = process.env.APP_TZ || "Asia/Ulaanbaatar";
const MASTERED = 2;            // алдааны дэвтрээс гарахын тулд дараалан зөв хийх тоо
const GRACE_MS = 30 * 1000;    // сүлжээний сааталд зориулсан уян хатан хугацаа
const QMAP = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));

const uid = () => crypto.randomUUID();
const now = () => Date.now();
const h = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const bad = (res, code, message) => res.status(code).json({ error: message });
const J = (s, d) => { try { return s ? JSON.parse(s) : d; } catch (e) { return d; } };

// ============ Цагийн бүс ============
function tzParts(ms) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: APP_TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false });
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24, minute: Number(p.minute), weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday) };
}
const today = () => tzParts(now()).day;
function addDays(day, n) { const [y, m, d] = day.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); }
function dayDiff(a, b) { const t = s => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); }; return Math.round((t(b) - t(a)) / 86400000); }
function localToMs(day, hour) {
  const [y, m, d] = day.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, hour, 0);
  const p = tzParts(guess);
  const [py, pm, pd] = p.day.split("-").map(Number);
  const offset = Date.UTC(py, pm - 1, pd, p.hour, p.minute) - guess;
  return guess - offset;
}

// ============ Асуулт ============
function publicQ(q, withAnswer) {
  const out = {
    id: q.id, subject: q.subject, domain: q.domain, difficulty: q.difficulty || 2,
    q_en: q.q_en, q_mn: q.q_mn || null,
    passage_en: q.passage_en || null, passage_mn: q.passage_mn || null,
    options_en: q.options_en, options_mn: q.options_mn || null
  };
  if (withAnswer) Object.assign(out, { answer: q.answer, e_en: q.e_en, e_mn: q.e_mn || null });
  return out;
}
function shuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}
const diffOk = (q, diff) => !diff || diff === "all" || String(q.difficulty || 2) === String(diff);
function builtinPool(subject, domain, diff) {
  return QUESTIONS.filter(q => q.subject === subject && (domain === "all" || q.domain === domain) && diffOk(q, diff));
}
function rowToQ(r) { return { difficulty: 2, ...J(r.data, {}), id: r.id, subject: r.subject, domain: r.domain, custom: true, teacherId: r.teacher_id }; }
async function customPool(teacherId, subject, domain, diff) {
  const rows = await db.q("SELECT * FROM custom_questions WHERE teacher_id=$1 AND subject=$2 ORDER BY created_at", [teacherId, subject]);
  return rows.map(rowToQ).filter(q => (domain === "all" || q.domain === domain) && diffOk(q, diff));
}
async function sourcePool(teacherId, subject, domain, diff, source) {
  const mine = teacherId ? await customPool(teacherId, subject, domain, diff) : [];
  if (source === "mine") return mine;
  if (source === "builtin") return builtinPool(subject, domain, diff);
  return [...builtinPool(subject, domain, diff), ...mine];
}
async function qmapFor(ids) {
  const m = {};
  for (const id of ids) {
    if (m[id]) continue;
    if (QMAP[id]) m[id] = QMAP[id];
    else { const r = await db.one("SELECT * FROM custom_questions WHERE id=$1", [id]); if (r) m[id] = rowToQ(r); }
  }
  return m;
}
function grade(ids, answers, map) {
  let correct = 0;
  const byDomain = {};
  ids.forEach(id => {
    const q = map[id]; if (!q) return;
    byDomain[q.domain] = byDomain[q.domain] || [0, 0];
    byDomain[q.domain][1]++;
    if (answers[id] === q.answer) { correct++; byDomain[q.domain][0]++; }
  });
  return { correct, total: ids.length, byDomain };
}
const scaled = (c, t) => (t ? Math.round((200 + (600 * c) / t) / 10) * 10 : 200);
// Adaptive оноо: 2-р модуль хүнд бол дээд хязгаар 800, хялбар бол ~620.
function adaptiveScore(m1c, m1n, m2c, m2n, pathHard) {
  const p = 0.4 * (m1n ? m1c / m1n : 0) + 0.6 * (m2n ? m2c / m2n : 0);
  const max = pathHard ? 600 : 420;
  return Math.round((200 + max * p) / 10) * 10;
}

// ============ Нэвтрэлт ============
async function newSession(kind, userId) {
  const token = crypto.randomBytes(24).toString("hex");
  await db.q("INSERT INTO sessions (token, kind, user_id, created_at) VALUES ($1,$2,$3,$4)", [token, kind, userId, now()]);
  return token;
}
function auth(kind) {
  return h(async (req, res, next) => {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token) return bad(res, 401, "Нэвтэрнэ үү.");
    const s = await db.one("SELECT * FROM sessions WHERE token=$1 AND kind=$2", [token, kind]);
    if (!s) return bad(res, 401, "Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.");
    req.userId = s.user_id; req.token = token;
    next();
  });
}
const teacherAuth = auth("teacher");
const studentAuth = auth("student");
const randCode = (n, chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789") => Array.from({ length: n }, () => chars[crypto.randomInt(chars.length)]).join("");

async function ownClass(teacherId, classId) {
  const c = await db.one("SELECT * FROM classes WHERE id=$1", [classId]);
  if (!c) return null;
  if (c.teacher_id === teacherId) return { ...c, isOwner: true };
  const ct = await db.one("SELECT id FROM class_teachers WHERE id=$1", [classId + ":" + teacherId]);
  return ct ? { ...c, isOwner: false } : null;
}
async function ownAssignment(teacherId, id) {
  const a = await db.one("SELECT * FROM assignments WHERE id=$1", [id]);
  if (!a) return null;
  const c = await ownClass(teacherId, a.class_id);
  return c ? { a, c } : null;
}
const targetIds = a => J(a.student_ids, null);
const isTarget = (a, sid) => { const t = targetIds(a); return !t || t.includes(sid); };
// Даалгаварт хамаарах бүх асуултын id (adaptive бол 2-р модулийн сан ч орно)
function allAssignmentIds(a) {
  const base = J(a.question_ids, []);
  if (a.mode !== "adaptive") return base;
  const ad = J(a.adaptive, { hard: [], easy: [] });
  return [...new Set([...base, ...ad.hard, ...ad.easy])];
}

// ============ Идэвх, streak, тэмдэг ============
async function recordActivity(studentId, questions, correct, cleared = 0) {
  const day = today(), id = studentId + ":" + day;
  const ex = await db.one("SELECT * FROM activity WHERE id=$1", [id]);
  if (ex) await db.q("UPDATE activity SET questions=$1, correct=$2, cleared=$3 WHERE id=$4", [ex.questions + questions, ex.correct + correct, ex.cleared + cleared, id]);
  else await db.q("INSERT INTO activity (id,student_id,day,questions,correct,cleared) VALUES ($1,$2,$3,$4,$5,$6)", [id, studentId, day, questions, correct, cleared]);
}
function streaks(days) {
  const set = new Set(days), sorted = [...set].sort();
  let best = 0, run = 0, prev = null;
  for (const d of sorted) { run = prev && dayDiff(prev, d) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = d; }
  let cur = 0, d = today();
  if (!set.has(d)) d = addDays(d, -1);
  while (set.has(d)) { cur++; d = addDays(d, -1); }
  return { current: cur, best, today: set.has(today()) };
}
async function updateMistakes(studentId, ids, answers, map) {
  let cleared = 0;
  for (const id of ids) {
    if (!map[id]) continue;
    const ok = answers[id] === map[id].answer, mid = studentId + ":" + id;
    const ex = await db.one("SELECT * FROM mistakes WHERE id=$1", [mid]);
    if (!ok) {
      if (ex) await db.q("UPDATE mistakes SET streak=0, updated_at=$1 WHERE id=$2", [now(), mid]);
      else await db.q("INSERT INTO mistakes (id,student_id,question_id,streak,updated_at) VALUES ($1,$2,$3,0,$4)", [mid, studentId, id, now()]);
    } else if (ex) {
      if (ex.streak + 1 >= MASTERED) { await db.q("DELETE FROM mistakes WHERE id=$1", [mid]); cleared++; }
      else await db.q("UPDATE mistakes SET streak=$1, updated_at=$2 WHERE id=$3", [ex.streak + 1, now(), mid]);
    }
  }
  return cleared;
}
// Сурагчийн нэгтгэл: түүх, сэдэв, streak, тэмдэг, зорилго
async function studentProfile(s) {
  const atts = (await db.q("SELECT * FROM attempts WHERE student_id=$1", [s.id])).filter(t => t.submitted_at);
  const history = [];
  const domains = {};
  let perfect = false;
  for (const t of atts) {
    const a = await db.one("SELECT title,subject FROM assignments WHERE id=$1", [t.assignment_id]);
    if (!a) continue;
    const score = t.score ?? scaled(t.correct, t.total);
    history.push({ at: t.submitted_at, subject: a.subject, title: a.title, score, correct: t.correct, total: t.total });
    if (t.total && t.correct === t.total) perfect = true;
    for (const [d, [c, n]] of Object.entries(J(t.by_domain, {}))) {
      const k = a.subject + ":" + d; domains[k] = domains[k] || [0, 0]; domains[k][0] += c; domains[k][1] += n;
    }
  }
  history.sort((x, y) => x.at - y.at);
  const act = await db.q("SELECT * FROM activity WHERE student_id=$1", [s.id]);
  const st = streaks(act.map(a => a.day));
  const totalQ = act.reduce((x, a) => x + a.questions, 0), cleared = act.reduce((x, a) => x + a.cleared, 0);
  const weekStart = addDays(today(), -6);
  const weekQ = act.filter(a => a.day >= weekStart).reduce((x, a) => x + a.questions, 0);
  const todayQ = (act.find(a => a.day === today()) || { questions: 0 }).questions;
  const badges = [];
  if (history.length) badges.push({ id: "first" });
  if (st.best >= 3) badges.push({ id: "streak3" });
  if (st.best >= 7) badges.push({ id: "streak7" });
  if (perfect) badges.push({ id: "perfect" });
  if (totalQ >= 100) badges.push({ id: "hundred" });
  if (cleared >= 10) badges.push({ id: "cleaner" });
  for (const [k, [c, n]] of Object.entries(domains)) if (n >= 8 && c / n >= 0.8) { const [sj, d] = k.split(":"); badges.push({ id: "master", subject: sj, domain: d }); }
  // зорилго ба өдрийн төлөвлөгөө
  const goal = await db.one("SELECT * FROM student_goals WHERE student_id=$1", [s.id]);
  const est = {};
  for (const sj of Object.keys(SUBJECTS)) {
    const last = history.filter(x => x.subject === sj).slice(-3);
    est[sj] = last.length ? Math.round(last.reduce((x, y) => x + y.score, 0) / last.length / 10) * 10 : null;
  }
  let plan = null;
  if (goal) {
    const current = Object.values(est).every(v => v !== null) ? est.M + est.E : (Object.values(est).find(v => v !== null) ?? 400) * 2;
    const daysLeft = Math.max(0, dayDiff(today(), goal.exam_day));
    const gap = Math.max(0, goal.target - current);
    const weeks = Math.max(1, daysLeft / 7);
    const daily = Math.max(5, Math.min(40, Math.round(8 + gap / (weeks * 12))));
    plan = { target: goal.target, examDay: goal.exam_day, daysLeft, current, gap, daily };
  }
  const weakest = Object.entries(domains).filter(([, [, n]]) => n >= 2).map(([k, [c, n]]) => ({ k, p: c / n })).sort((a, b) => a.p - b.p).slice(0, 2).map(x => x.k);
  return { history, domains, streak: st, totalQ, weekQ, todayQ, badges, goal: goal ? { target: goal.target, examDay: goal.exam_day } : null, estimate: est, plan, weakest };
}

// ============ Давтагддаг даалгавар ============
async function createAssignment({ classId, teacherId, title, subject, domain, count, timeLimitMin, dueAt, source, difficulty, studentIds, mode }) {
  if (mode === "adaptive") {
    const all = await sourcePool(teacherId, subject, domain, "all", source);
    const half = Math.max(2, Math.floor((Number(count) || 12) / 2));
    if (all.length < half * 2) throw Object.assign(new Error(`Adaptive тестэд дор хаяж ${half * 2} асуулт хэрэгтэй. Сонгосон сэдвээр ${all.length} байна.`), { status: 400 });
    const m1 = shuffle(all.filter(q => (q.difficulty || 2) === 2)).concat(shuffle(all.filter(q => (q.difficulty || 2) !== 2))).slice(0, half);
    const rest = all.filter(q => !m1.includes(q));
    const hard = rest.filter(q => (q.difficulty || 2) >= 2).sort((a, b) => (b.difficulty || 2) - (a.difficulty || 2));
    const easy = rest.filter(q => (q.difficulty || 2) <= 2).sort((a, b) => (a.difficulty || 2) - (b.difficulty || 2));
    const fill = (list) => list.concat(shuffle(rest.filter(q => !list.includes(q)))).slice(0, half).map(q => q.id);
    const id = uid();
    await db.q(`INSERT INTO assignments (id,class_id,title,subject,domain,question_ids,time_limit_min,due_at,created_at,difficulty,student_ids,mode,adaptive)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [id, classId, title, subject, domain, JSON.stringify(m1.map(q => q.id)), timeLimitMin, dueAt, now(), null,
        studentIds ? JSON.stringify(studentIds) : null, "adaptive", JSON.stringify({ hard: fill(hard), easy: fill(easy), half })]);
    return id;
  }
  const p = await sourcePool(teacherId, subject, domain, difficulty, source);
  if (!p.length) throw Object.assign(new Error("Сонгосон нөхцөлөөр асуулт алга. Сэдэв, түвшингээ өөрчилнө үү."), { status: 400 });
  const n = Math.max(1, Math.min(Number(count) || p.length, p.length));
  const ids = shuffle(p).slice(0, n).map(q => q.id);
  const id = uid();
  await db.q(`INSERT INTO assignments (id,class_id,title,subject,domain,question_ids,time_limit_min,due_at,created_at,difficulty,student_ids,mode)
              VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [id, classId, title, subject, domain, JSON.stringify(ids), timeLimitMin, dueAt, now(), difficulty && difficulty !== "all" ? String(difficulty) : null,
      studentIds ? JSON.stringify(studentIds) : null, "standard"]);
  return id;
}

async function runRecurring(classId) {
  const rules = await db.q("SELECT * FROM recurring WHERE class_id=$1", [classId]);
  if (!rules.length) return;
  const c = await db.one("SELECT * FROM classes WHERE id=$1", [classId]);
  const p = tzParts(now());
  for (const r of rules) {
    let back = (p.weekday - r.run_weekday + 7) % 7;
    if (back === 0 && p.hour < r.run_hour) back = 7;
    const occDay = addDays(p.day, -back);
    const occMs = localToMs(occDay, r.run_hour);
    if (occMs < r.created_at - 60000 || (r.last_run_day && r.last_run_day >= occDay)) continue;
    // давхар үүсгэхээс сэргийлж эхлээд тэмдэглэнэ
    await db.q("UPDATE recurring SET last_run_day=$1 WHERE id=$2", [occDay, r.id]);
    const due = localToMs(addDays(occDay, r.days_open), r.run_hour);
    if (due < now()) continue;
    try {
      await createAssignment({ classId, teacherId: c.teacher_id, title: `${r.title} · ${occDay.slice(5)}`, subject: r.subject, domain: r.domain,
        count: r.q_count, timeLimitMin: r.time_limit_min, dueAt: due, source: "all", difficulty: r.difficulty, mode: "standard" });
    } catch (e) { console.error("recurring:", e.message); }
  }
}
setInterval(async () => {
  try { for (const r of await db.q("SELECT DISTINCT class_id FROM recurring")) await runRecurring(r.class_id); } catch (e) {}
}, 5 * 60 * 1000);

// ============ Нийтийн API ============
app.get("/api/meta", (req, res) => {
  res.json({
    subjects: SUBJECTS,
    counts: Object.fromEntries(Object.keys(SUBJECTS).map(s => [s, QUESTIONS.filter(q => q.subject === s).length])),
    inviteRequired: !!TEACHER_INVITE_CODE, demoStorage: db.isInMemory(), mastered: MASTERED
  });
});
app.get("/api/practice", (req, res) => {
  const { subject = "M", domain = "all", difficulty = "all" } = req.query;
  if (!SUBJECTS[subject]) return bad(res, 400, "Хичээл буруу байна.");
  res.json({ questions: builtinPool(subject, domain, difficulty).map(q => publicQ(q, true)) });
});
app.get("/api/vocab", (req, res) => res.json({ words: VOCAB }));

// ============ Багш: бүртгэл ============
app.post("/api/teacher/register", h(async (req, res) => {
  const { name, email, password, invite } = req.body || {};
  if (!name || !email || !password) return bad(res, 400, "Нэр, имэйл, нууц үгээ бөглөнө үү.");
  if (String(password).length < 6) return bad(res, 400, "Нууц үг дор хаяж 6 тэмдэгт байна.");
  if (TEACHER_INVITE_CODE && invite !== TEACHER_INVITE_CODE) return bad(res, 403, "Багшийн урилгын код буруу байна.");
  const em = String(email).trim().toLowerCase();
  if (await db.one("SELECT id FROM teachers WHERE email=$1", [em])) return bad(res, 409, "Энэ имэйлээр бүртгэл аль хэдийн бий.");
  const id = uid(), recovery = randCode(10);
  await db.q("INSERT INTO teachers (id,name,email,pass_hash,created_at,recovery_hash) VALUES ($1,$2,$3,$4,$5,$6)",
    [id, String(name).trim(), em, await bcrypt.hash(String(password), 10), now(), await bcrypt.hash(recovery, 10)]);
  res.json({ token: await newSession("teacher", id), recoveryCode: recovery });
}));
app.post("/api/teacher/login", h(async (req, res) => {
  const { email, password } = req.body || {};
  const t = await db.one("SELECT * FROM teachers WHERE email=$1", [String(email || "").trim().toLowerCase()]);
  if (!t || !(await bcrypt.compare(String(password || ""), t.pass_hash))) return bad(res, 401, "Имэйл эсвэл нууц үг буруу байна.");
  res.json({ token: await newSession("teacher", t.id) });
}));
app.post("/api/teacher/reset", h(async (req, res) => {
  const { email, recoveryCode, newPassword } = req.body || {};
  const t = await db.one("SELECT * FROM teachers WHERE email=$1", [String(email || "").trim().toLowerCase()]);
  if (String(newPassword || "").length < 6) return bad(res, 400, "Шинэ нууц үг дор хаяж 6 тэмдэгт байна.");
  if (!t || !t.recovery_hash || !(await bcrypt.compare(String(recoveryCode || "").trim().toUpperCase(), t.recovery_hash)))
    return bad(res, 401, "Имэйл эсвэл сэргээх код буруу байна.");
  const recovery = randCode(10);
  await db.q("UPDATE teachers SET pass_hash=$1, recovery_hash=$2 WHERE id=$3", [await bcrypt.hash(String(newPassword), 10), await bcrypt.hash(recovery, 10), t.id]);
  await db.q("DELETE FROM sessions WHERE user_id=$1 AND kind='teacher'", [t.id]);
  res.json({ token: await newSession("teacher", t.id), recoveryCode: recovery });
}));
app.post("/api/teacher/password", teacherAuth, h(async (req, res) => {
  const { current, next } = req.body || {};
  const t = await db.one("SELECT * FROM teachers WHERE id=$1", [req.userId]);
  if (!(await bcrypt.compare(String(current || ""), t.pass_hash))) return bad(res, 401, "Одоогийн нууц үг буруу байна.");
  if (String(next || "").length < 6) return bad(res, 400, "Шинэ нууц үг дор хаяж 6 тэмдэгт байна.");
  await db.q("UPDATE teachers SET pass_hash=$1 WHERE id=$2", [await bcrypt.hash(String(next), 10), t.id]);
  await db.q("DELETE FROM sessions WHERE user_id=$1 AND kind='teacher' AND token<>$2", [t.id, req.token]);
  res.json({ ok: true });
}));
app.post("/api/teacher/recovery", teacherAuth, h(async (req, res) => {
  const recovery = randCode(10);
  await db.q("UPDATE teachers SET recovery_hash=$1 WHERE id=$2", [await bcrypt.hash(recovery, 10), req.userId]);
  res.json({ recoveryCode: recovery });
}));

// ============ Багш: анги ============
app.get("/api/teacher/me", teacherAuth, h(async (req, res) => {
  const t = await db.one("SELECT id,name,email FROM teachers WHERE id=$1", [req.userId]);
  const own = await db.q("SELECT * FROM classes WHERE teacher_id=$1 ORDER BY created_at", [req.userId]);
  const co = await db.q("SELECT class_id FROM class_teachers WHERE teacher_id=$1", [req.userId]);
  const classes = own.map(c => ({ ...c, isOwner: true }));
  for (const x of co) { const c = await db.one("SELECT * FROM classes WHERE id=$1", [x.class_id]); if (c) classes.push({ ...c, isOwner: false }); }
  for (const c of classes) c.studentCount = (await db.q("SELECT id FROM students WHERE class_id=$1", [c.id])).length;
  res.json({ teacher: t, classes });
}));
app.post("/api/teacher/classes", teacherAuth, h(async (req, res) => {
  const name = String((req.body || {}).name || "").trim();
  if (!name) return bad(res, 400, "Ангийн нэрийг бичнэ үү.");
  let code;
  do { code = randCode(6); } while (await db.one("SELECT id FROM classes WHERE code=$1", [code]));
  const id = uid();
  await db.q("INSERT INTO classes (id,teacher_id,name,code,created_at) VALUES ($1,$2,$3,$4,$5)", [id, req.userId, name, code, now()]);
  res.json({ id, name, code });
}));
app.get("/api/teacher/classes/:id", teacherAuth, h(async (req, res) => {
  const c = await ownClass(req.userId, req.params.id);
  if (!c) return bad(res, 404, "Анги олдсонгүй.");
  await runRecurring(c.id);
  const students = await db.q("SELECT id,name,created_at FROM students WHERE class_id=$1 ORDER BY name", [c.id]);
  const assignments = await db.q("SELECT * FROM assignments WHERE class_id=$1 ORDER BY created_at DESC", [c.id]);
  for (const a of assignments) {
    const at = await db.q("SELECT submitted_at FROM attempts WHERE assignment_id=$1", [a.id]);
    a.submitted = at.filter(x => x.submitted_at).length;
    const tg = targetIds(a);
    a.targetCount = tg ? tg.length : students.length;
    a.targeted = !!tg;
    a.questionCount = a.mode === "adaptive" ? J(a.question_ids, []).length * 2 : J(a.question_ids, []).length;
    delete a.question_ids; delete a.adaptive; delete a.student_ids;
  }
  const recurring = await db.q("SELECT * FROM recurring WHERE class_id=$1 ORDER BY created_at", [c.id]);
  const owner = await db.one("SELECT id,name,email FROM teachers WHERE id=$1", [c.teacher_id]);
  const teachers = [{ ...owner, isOwner: true }];
  for (const x of await db.q("SELECT teacher_id FROM class_teachers WHERE class_id=$1", [c.id])) {
    const t = await db.one("SELECT id,name,email FROM teachers WHERE id=$1", [x.teacher_id]); if (t) teachers.push({ ...t, isOwner: false });
  }
  res.json({ class: c, students, assignments, recurring, teachers });
}));
app.post("/api/teacher/classes/:id/teachers", teacherAuth, h(async (req, res) => {
  const c = await ownClass(req.userId, req.params.id);
  if (!c || !c.isOwner) return bad(res, 403, "Зөвхөн ангийн эзэн багш нэмж чадна.");
  const t = await db.one("SELECT id FROM teachers WHERE email=$1", [String((req.body || {}).email || "").trim().toLowerCase()]);
  if (!t) return bad(res, 404, "Ийм имэйлтэй багш бүртгэлгүй байна. Эхлээд тэр багш бүртгүүлэх хэрэгтэй.");
  if (t.id === c.teacher_id) return bad(res, 400, "Та энэ ангийн эзэн байна.");
  const id = c.id + ":" + t.id;
  if (!(await db.one("SELECT id FROM class_teachers WHERE id=$1", [id])))
    await db.q("INSERT INTO class_teachers (id,class_id,teacher_id,created_at) VALUES ($1,$2,$3,$4)", [id, c.id, t.id, now()]);
  res.json({ ok: true });
}));
app.delete("/api/teacher/classes/:id/teachers/:tid", teacherAuth, h(async (req, res) => {
  const c = await ownClass(req.userId, req.params.id);
  if (!c || !c.isOwner) return bad(res, 403, "Зөвхөн ангийн эзэн хасаж чадна.");
  await db.q("DELETE FROM class_teachers WHERE id=$1", [c.id + ":" + req.params.tid]);
  res.json({ ok: true });
}));

// ============ Багш: сурагч ============
async function ownStudent(teacherId, sid) {
  const s = await db.one("SELECT * FROM students WHERE id=$1", [sid]);
  return s && (await ownClass(teacherId, s.class_id)) ? s : null;
}
app.delete("/api/teacher/students/:id", teacherAuth, h(async (req, res) => {
  const s = await ownStudent(req.userId, req.params.id);
  if (!s) return bad(res, 404, "Сурагч олдсонгүй.");
  for (const tbl of ["attempts", "mistakes", "activity", "live_answers"]) await db.q(`DELETE FROM ${tbl} WHERE student_id=$1`, [s.id]);
  await db.q("DELETE FROM student_goals WHERE student_id=$1", [s.id]);
  await db.q("DELETE FROM sessions WHERE user_id=$1 AND kind='student'", [s.id]);
  await db.q("DELETE FROM students WHERE id=$1", [s.id]);
  res.json({ ok: true });
}));
app.post("/api/teacher/students/:id/pin", teacherAuth, h(async (req, res) => {
  const s = await ownStudent(req.userId, req.params.id);
  if (!s) return bad(res, 404, "Сурагч олдсонгүй.");
  const pin = String((req.body || {}).pin || "");
  if (!/^\d{4}$/.test(pin)) return bad(res, 400, "PIN 4 оронтой тоо байна.");
  await db.q("UPDATE students SET pin_hash=$1 WHERE id=$2", [await bcrypt.hash(pin, 10), s.id]);
  await db.q("DELETE FROM sessions WHERE user_id=$1 AND kind='student'", [s.id]);
  res.json({ ok: true });
}));
app.get("/api/teacher/students/:id", teacherAuth, h(async (req, res) => {
  const s = await ownStudent(req.userId, req.params.id);
  if (!s) return bad(res, 404, "Сурагч олдсонгүй.");
  const p = await studentProfile(s);
  const mistakes = (await db.q("SELECT id FROM mistakes WHERE student_id=$1", [s.id])).length;
  res.json({ student: { id: s.id, name: s.name }, ...p, mistakes });
}));

// ============ Багш: даалгавар ============
app.post("/api/teacher/assignments", teacherAuth, h(async (req, res) => {
  const b = req.body || {};
  const c = await ownClass(req.userId, b.classId);
  if (!c) return bad(res, 404, "Анги олдсонгүй.");
  if (!String(b.title || "").trim()) return bad(res, 400, "Даалгаврын гарчгийг бичнэ үү.");
  if (!SUBJECTS[b.subject]) return bad(res, 400, "Хичээл буруу байна.");
  const domain = b.domain || "all";
  if (domain !== "all" && !SUBJECTS[b.subject].domains[domain]) return bad(res, 400, "Сэдэв буруу байна.");
  const due = b.dueAt ? Number(b.dueAt) : null;
  if (due && due < now()) return bad(res, 400, "Хаагдах хугацаа өнгөрсөн байна.");
  try {
    const id = await createAssignment({ classId: c.id, teacherId: req.userId, title: String(b.title).trim(), subject: b.subject, domain,
      count: b.count, timeLimitMin: Math.max(1, Math.min(Number(b.timeLimitMin) || 10, 180)), dueAt: due,
      source: b.source || "all", difficulty: b.difficulty || "all", mode: b.mode === "adaptive" ? "adaptive" : "standard" });
    res.json({ id });
  } catch (e) { if (e.status) return bad(res, e.status, e.message); throw e; }
}));
app.delete("/api/teacher/assignments/:id", teacherAuth, h(async (req, res) => {
  const own = await ownAssignment(req.userId, req.params.id);
  if (!own) return bad(res, 404, "Даалгавар олдсонгүй.");
  await db.q("DELETE FROM attempts WHERE assignment_id=$1", [own.a.id]);
  await db.q("DELETE FROM assignments WHERE id=$1", [own.a.id]);
  res.json({ ok: true });
}));

async function assignmentResults(a, c) {
  const allIds = allAssignmentIds(a);
  const map = await qmapFor(allIds);
  const tg = targetIds(a);
  const students = (await db.q("SELECT id,name FROM students WHERE class_id=$1 ORDER BY name", [c.id])).filter(s => !tg || tg.includes(s.id));
  const attempts = await db.q("SELECT * FROM attempts WHERE assignment_id=$1", [a.id]);
  const byStudent = Object.fromEntries(attempts.map(t => [t.student_id, t]));
  const qStats = Object.fromEntries(allIds.filter(id => map[id]).map(id => [id, { correct: 0, answered: 0, seen: 0 }]));
  const t0 = now();
  const nQ = a.mode === "adaptive" ? J(a.question_ids, []).length * 2 : J(a.question_ids, []).length;
  const rows = students.map(s => {
    const t = byStudent[s.id];
    let status = "not_started";
    if (t && t.submitted_at) status = t.late ? "late" : "submitted";
    else if (t && t0 > t.deadline + GRACE_MS) status = "expired";
    else if (t) status = "in_progress";
    if (t && t.submitted_at) {
      const ans = J(t.answers, {});
      const seen = a.mode === "adaptive" ? [...J(a.question_ids, []), ...J(t.module2_ids, [])] : J(a.question_ids, []);
      seen.forEach(id => { if (!qStats[id]) return; qStats[id].seen++; if (ans[id] !== undefined) { qStats[id].answered++; if (ans[id] === map[id].answer) qStats[id].correct++; } });
    }
    return {
      studentId: s.id, name: s.name, status,
      correct: t?.submitted_at ? t.correct : null, total: t?.total || nQ,
      score: t?.submitted_at ? (t.score ?? scaled(t.correct, t.total)) : null,
      seconds: t?.submitted_at ? Math.round((t.submitted_at - t.started_at) / 1000) : null,
      submittedAt: t?.submitted_at || null, byDomain: t?.by_domain ? J(t.by_domain, null) : null,
      path: t?.adaptive_path || null
    };
  });
  const questions = Object.keys(qStats).map((id, i) => ({ n: i + 1, ...publicQ(map[id], true), stats: qStats[id] })).filter(q => a.mode !== "adaptive" || q.stats.seen);
  const out = { ...a, questionCount: nQ, targeted: !!tg };
  delete out.question_ids; delete out.adaptive; delete out.student_ids;
  return { assignment: out, class: c, rows, questions };
}
app.get("/api/teacher/assignments/:id/results", teacherAuth, h(async (req, res) => {
  const own = await ownAssignment(req.userId, req.params.id);
  if (!own) return bad(res, 404, "Даалгавар олдсонгүй.");
  res.json(await assignmentResults(own.a, own.c));
}));
app.get("/api/teacher/assignments/:id/results.csv", teacherAuth, h(async (req, res) => {
  const own = await ownAssignment(req.userId, req.params.id);
  if (!own) return bad(res, 404, "Даалгавар олдсонгүй.");
  const r = await assignmentResults(own.a, own.c);
  const st = { not_started: "Эхлээгүй", in_progress: "Хийж байна", submitted: "Илгээсэн", late: "Хоцорч илгээсэн", expired: "Хугацаа дууссан" };
  const doms = SUBJECTS[own.a.subject].domains;
  const cell = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Сурагч", "Төлөв", "Зөв", "Нийт", "Хувь", "Тооцоолсон оноо", "Хугацаа (сек)", "Илгээсэн", "2-р модуль", ...Object.values(doms).map(d => d.en)];
  const lines = [head.map(cell).join(",")];
  r.rows.forEach(x => lines.push([
    x.name, st[x.status], x.correct ?? "", x.total, x.correct !== null ? Math.round((x.correct / x.total) * 100) + "%" : "",
    x.score ?? "", x.seconds ?? "", x.submittedAt ? new Date(x.submittedAt).toISOString() : "", x.path ? (x.path === "hard" ? "Хүнд" : "Хялбар") : "",
    ...Object.keys(doms).map(k => (x.byDomain && x.byDomain[k] ? `${x.byDomain[k][0]}/${x.byDomain[k][1]}` : ""))
  ].map(cell).join(",")));
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="results-${own.a.id.slice(0, 8)}.csv"`);
  res.send("﻿" + lines.join("\n"));
}));
// Сул сурагчдад нэмэлт даалгавар
app.post("/api/teacher/assignments/:id/followup", teacherAuth, h(async (req, res) => {
  const own = await ownAssignment(req.userId, req.params.id);
  if (!own) return bad(res, 404, "Даалгавар олдсонгүй.");
  const threshold = Number((req.body || {}).threshold) || 0.6;
  const r = await assignmentResults(own.a, own.c);
  const weak = r.rows.filter(x => x.correct !== null && x.correct / x.total < threshold);
  if (!weak.length) return bad(res, 400, "Босгоос доош оноотой сурагч алга.");
  const agg = {};
  weak.forEach(x => Object.entries(x.byDomain || {}).forEach(([d, [c, n]]) => { agg[d] = agg[d] || [0, 0]; agg[d][0] += c; agg[d][1] += n; }));
  const domain = Object.entries(agg).sort((x, y) => x[1][0] / x[1][1] - y[1][0] / y[1][1])[0]?.[0] || "all";
  const pool = await sourcePool(req.userId, own.a.subject, domain, "all", "all");
  const count = Math.min(6, pool.length);
  const id = await createAssignment({ classId: own.c.id, teacherId: req.userId, title: `Нэмэлт: ${own.a.title}`, subject: own.a.subject, domain,
    count, timeLimitMin: Math.max(3, Math.round(count * SUBJECTS[own.a.subject].secondsPerQuestion / 60)), dueAt: now() + 3 * 86400000,
    source: "all", difficulty: "all", studentIds: weak.map(x => x.studentId), mode: "standard" });
  res.json({ id, students: weak.map(x => x.name), domain });
}));

// ============ Багш: давтагддаг даалгавар ============
app.post("/api/teacher/recurring", teacherAuth, h(async (req, res) => {
  const b = req.body || {};
  const c = await ownClass(req.userId, b.classId);
  if (!c) return bad(res, 404, "Анги олдсонгүй.");
  if (!String(b.title || "").trim() || !SUBJECTS[b.subject]) return bad(res, 400, "Гарчиг, хичээлээ сонгоно уу.");
  const wd = Number(b.weekday), hr = Number(b.hour);
  if (!(wd >= 0 && wd <= 6) || !(hr >= 0 && hr <= 23)) return bad(res, 400, "Өдөр, цагаа зөв сонгоно уу.");
  const id = uid();
  await db.q(`INSERT INTO recurring (id,class_id,title,subject,domain,difficulty,q_count,time_limit_min,run_weekday,run_hour,days_open,last_run_day,created_at)
              VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [id, c.id, String(b.title).trim(), b.subject, b.domain || "all", b.difficulty && b.difficulty !== "all" ? String(b.difficulty) : null,
      Math.max(1, Math.min(Number(b.count) || 8, 40)), Math.max(1, Math.min(Number(b.timeLimitMin) || 10, 180)), wd, hr,
      Math.max(1, Math.min(Number(b.daysOpen) || 3, 14)), null, now()]);
  await runRecurring(c.id);
  res.json({ id });
}));
app.delete("/api/teacher/recurring/:id", teacherAuth, h(async (req, res) => {
  const r = await db.one("SELECT * FROM recurring WHERE id=$1", [req.params.id]);
  if (!r || !(await ownClass(req.userId, r.class_id))) return bad(res, 404, "Олдсонгүй.");
  await db.q("DELETE FROM recurring WHERE id=$1", [r.id]);
  res.json({ ok: true });
}));

// ============ Багш: асуултын сан ============
function cleanQuestion(b) {
  const s = v => String(v ?? "").trim();
  const subject = s(b.subject), domain = s(b.domain);
  if (!SUBJECTS[subject] || !SUBJECTS[subject].domains[domain]) return { error: "Хичээл, сэдвээ сонгоно уу." };
  const options_en = (b.options_en || []).map(s);
  if (options_en.length !== 4 || options_en.some(o => !o)) return { error: "Англи хэлээр 4 хувилбарыг бүгдийг бөглөнө үү." };
  let options_mn = (b.options_mn || []).map(s);
  options_mn = options_mn.length === 4 && options_mn.every(Boolean) ? options_mn : null;
  const answer = Number(b.answer);
  if (![0, 1, 2, 3].includes(answer)) return { error: "Зөв хариултыг сонгоно уу." };
  if (!s(b.q_en) && !s(b.q_mn)) return { error: "Асуултын текстийг бичнэ үү." };
  const difficulty = [1, 2, 3].includes(Number(b.difficulty)) ? Number(b.difficulty) : 2;
  const data = {
    q_en: s(b.q_en) || s(b.q_mn), q_mn: s(b.q_mn) || null,
    passage_en: s(b.passage_en) || null, passage_mn: s(b.passage_mn) || null,
    options_en, options_mn, answer, difficulty,
    e_en: s(b.e_en) || s(b.e_mn) || "", e_mn: s(b.e_mn) || null
  };
  if (JSON.stringify(data).length > 20000) return { error: "Асуулт хэт урт байна." };
  return { subject, domain, data };
}
app.get("/api/teacher/questions", teacherAuth, h(async (req, res) => {
  const rows = await db.q("SELECT * FROM custom_questions WHERE teacher_id=$1 ORDER BY created_at DESC", [req.userId]);
  res.json({ questions: rows.map(r => publicQ(rowToQ(r), true)), builtinCounts: Object.fromEntries(Object.keys(SUBJECTS).map(s => [s, QUESTIONS.filter(q => q.subject === s).length])) });
}));
app.post("/api/teacher/questions", teacherAuth, h(async (req, res) => {
  const c = cleanQuestion(req.body || {});
  if (c.error) return bad(res, 400, c.error);
  const id = "c-" + uid();
  await db.q("INSERT INTO custom_questions (id,teacher_id,subject,domain,data,created_at) VALUES ($1,$2,$3,$4,$5,$6)",
    [id, req.userId, c.subject, c.domain, JSON.stringify(c.data), now()]);
  res.json({ id });
}));
app.delete("/api/teacher/questions/:id", teacherAuth, h(async (req, res) => {
  const r = await db.one("SELECT * FROM custom_questions WHERE id=$1 AND teacher_id=$2", [req.params.id, req.userId]);
  if (!r) return bad(res, 404, "Асуулт олдсонгүй.");
  const used = (await db.q("SELECT * FROM assignments")).some(a => allAssignmentIds(a).includes(r.id));
  if (used) return bad(res, 409, "Энэ асуулт даалгаварт орсон тул устгах боломжгүй. Эхлээд тухайн даалгаврыг устгана уу.");
  await db.q("DELETE FROM custom_questions WHERE id=$1", [r.id]);
  await db.q("DELETE FROM mistakes WHERE question_id=$1", [r.id]);
  res.json({ ok: true });
}));

// ============ Багш: ангийн шинжилгээ ============
app.get("/api/teacher/classes/:id/analysis", teacherAuth, h(async (req, res) => {
  const c = await ownClass(req.userId, req.params.id);
  if (!c) return bad(res, 404, "Анги олдсонгүй.");
  const students = await db.q("SELECT id,name FROM students WHERE class_id=$1", [c.id]);
  const sname = Object.fromEntries(students.map(s => [s.id, s.name]));
  const asg = await db.q("SELECT * FROM assignments WHERE class_id=$1", [c.id]);
  const domains = {}, qstat = {};
  let attemptsN = 0;
  for (const a of asg) {
    const map = await qmapFor(allAssignmentIds(a));
    for (const t of await db.q("SELECT * FROM attempts WHERE assignment_id=$1", [a.id])) {
      if (!t.submitted_at || !sname[t.student_id]) continue;
      attemptsN++;
      for (const [d, [cc, tt]] of Object.entries(J(t.by_domain, {}))) {
        const k = a.subject + ":" + d;
        const D = domains[k] = domains[k] || { correct: 0, total: 0, students: {} };
        D.correct += cc; D.total += tt;
        const S = D.students[t.student_id] = D.students[t.student_id] || [0, 0]; S[0] += cc; S[1] += tt;
      }
      const ans = J(t.answers, {});
      const seen = a.mode === "adaptive" ? [...J(a.question_ids, []), ...J(t.module2_ids, [])] : J(a.question_ids, []);
      for (const id of seen) {
        if (!map[id]) continue;
        qstat[id] = qstat[id] || { correct: 0, total: 0 }; qstat[id].total++;
        if (ans[id] === map[id].answer) qstat[id].correct++;
      }
    }
  }
  const dlist = Object.entries(domains).map(([k, D]) => {
    const [subject, domain] = k.split(":");
    const struggling = Object.entries(D.students).filter(([, [cc, tt]]) => tt && cc / tt < 0.6).map(([id]) => sname[id]);
    return { subject, domain, correct: D.correct, total: D.total, pct: D.total ? D.correct / D.total : 0, studentCount: Object.keys(D.students).length, struggling };
  }).sort((x, y) => x.pct - y.pct);
  const hard = Object.entries(qstat).map(([id, s]) => ({ id, ...s, pct: s.correct / s.total })).sort((x, y) => x.pct - y.pct || y.total - x.total).slice(0, 5);
  const hmap = await qmapFor(hard.map(x => x.id));
  // оролцооны самбар (энэ 7 хоног)
  const weekStart = addDays(today(), -6);
  const participation = [];
  for (const s of students) {
    const act = await db.q("SELECT * FROM activity WHERE student_id=$1", [s.id]);
    participation.push({ name: s.name, id: s.id, week: act.filter(a => a.day >= weekStart).reduce((x, a) => x + a.questions, 0), streak: streaks(act.map(a => a.day)).current });
  }
  participation.sort((a, b) => b.week - a.week);
  res.json({ attempts: attemptsN, domains: dlist, hardest: hard.map(x => ({ ...x, question: publicQ(hmap[x.id], true) })), participation });
}));

// ============ Багш: шууд асуулт ============
async function liveState(sess, withAnswer) {
  const ids = J(sess.question_ids, []);
  const map = await qmapFor(ids);
  const q = map[ids[sess.idx]];
  return { id: sess.id, title: sess.title, idx: sess.idx, total: ids.length, state: sess.state, question: q ? publicQ(q, withAnswer || sess.state !== "question") : null };
}
app.post("/api/teacher/live", teacherAuth, h(async (req, res) => {
  const b = req.body || {};
  const c = await ownClass(req.userId, b.classId);
  if (!c) return bad(res, 404, "Анги олдсонгүй.");
  if (!SUBJECTS[b.subject]) return bad(res, 400, "Хичээлээ сонгоно уу.");
  const pool = await sourcePool(req.userId, b.subject, b.domain || "all", b.difficulty || "all", b.source || "all");
  if (!pool.length) return bad(res, 400, "Сонгосон нөхцөлөөр асуулт алга.");
  const ids = shuffle(pool).slice(0, Math.max(1, Math.min(Number(b.count) || 5, pool.length))).map(q => q.id);
  for (const s of await db.q("SELECT id FROM live_sessions WHERE class_id=$1 AND state<>'ended'", [c.id]))
    await db.q("UPDATE live_sessions SET state='ended', updated_at=$1 WHERE id=$2", [now(), s.id]);
  const id = uid();
  const title = `${SUBJECTS[b.subject].mn} · ${b.domain && b.domain !== "all" ? SUBJECTS[b.subject].domains[b.domain].mn : "Холимог"}`;
  await db.q("INSERT INTO live_sessions (id,class_id,title,question_ids,idx,state,created_at,updated_at) VALUES ($1,$2,$3,$4,0,'question',$5,$5)",
    [id, c.id, title, JSON.stringify(ids), now()]);
  res.json({ id });
}));
async function ownLive(teacherId, id) {
  const s = await db.one("SELECT * FROM live_sessions WHERE id=$1", [id]);
  return s && (await ownClass(teacherId, s.class_id)) ? s : null;
}
app.get("/api/teacher/live/:id", teacherAuth, h(async (req, res) => {
  const sess = await ownLive(req.userId, req.params.id);
  if (!sess) return bad(res, 404, "Олдсонгүй.");
  const st = await liveState(sess, true);
  const answers = await db.q("SELECT * FROM live_answers WHERE session_id=$1", [sess.id]);
  const counts = [0, 0, 0, 0];
  answers.filter(a => a.idx === sess.idx).forEach(a => { if (counts[a.choice] !== undefined) counts[a.choice]++; });
  const students = await db.q("SELECT id,name FROM students WHERE class_id=$1", [sess.class_id]);
  const ids = J(sess.question_ids, []), map = await qmapFor(ids);
  const board = students.map(s => ({ name: s.name, correct: answers.filter(a => a.student_id === s.id && map[ids[a.idx]] && a.choice === map[ids[a.idx]].answer && (a.idx < sess.idx || sess.state !== "question")).length }))
    .sort((a, b) => b.correct - a.correct);
  res.json({ ...st, counts, answered: counts.reduce((a, b) => a + b, 0), studentCount: students.length, board });
}));
app.post("/api/teacher/live/:id/action", teacherAuth, h(async (req, res) => {
  const sess = await ownLive(req.userId, req.params.id);
  if (!sess) return bad(res, 404, "Олдсонгүй.");
  const action = (req.body || {}).action, total = J(sess.question_ids, []).length;
  if (action === "reveal") await db.q("UPDATE live_sessions SET state='reveal', updated_at=$1 WHERE id=$2", [now(), sess.id]);
  else if (action === "next" && sess.idx < total - 1) await db.q("UPDATE live_sessions SET idx=$1, state='question', updated_at=$2 WHERE id=$3", [sess.idx + 1, now(), sess.id]);
  else if (action === "end" || action === "next") await db.q("UPDATE live_sessions SET state='ended', updated_at=$1 WHERE id=$2", [now(), sess.id]);
  res.json({ ok: true });
}));

// ============ Сурагч ============
app.post("/api/student/join", h(async (req, res) => {
  const { code, name, pin } = req.body || {};
  const c = await db.one("SELECT * FROM classes WHERE code=$1", [String(code || "").trim().toUpperCase()]);
  if (!c) return bad(res, 404, "Ангийн код олдсонгүй. Багшаасаа кодоо дахин асуугаарай.");
  const nm = String(name || "").trim().replace(/\s+/g, " ");
  if (nm.length < 2) return bad(res, 400, "Нэрээ бүтэн бичнэ үү.");
  if (!/^\d{4}$/.test(String(pin || ""))) return bad(res, 400, "PIN код 4 оронтой тоо байна.");
  const existing = (await db.q("SELECT * FROM students WHERE class_id=$1", [c.id])).find(s => s.name.toLowerCase() === nm.toLowerCase());
  let id;
  if (existing) {
    if (!(await bcrypt.compare(String(pin), existing.pin_hash))) return bad(res, 401, "Энэ нэр ангид бүртгэлтэй, PIN код таарахгүй байна. PIN-ээ мартсан бол багшдаа хандаарай.");
    id = existing.id;
  } else {
    id = uid();
    await db.q("INSERT INTO students (id,class_id,name,pin_hash,created_at) VALUES ($1,$2,$3,$4,$5)", [id, c.id, nm, await bcrypt.hash(String(pin), 10), now()]);
  }
  res.json({ token: await newSession("student", id) });
}));

app.get("/api/student/me", studentAuth, h(async (req, res) => {
  const s = await db.one("SELECT id,name,class_id FROM students WHERE id=$1", [req.userId]);
  if (!s) return bad(res, 401, "Бүртгэл олдсонгүй.");
  await runRecurring(s.class_id);
  const c = await db.one("SELECT id,name,code FROM classes WHERE id=$1", [s.class_id]);
  const as = (await db.q("SELECT * FROM assignments WHERE class_id=$1 ORDER BY created_at DESC", [s.class_id])).filter(a => isTarget(a, s.id));
  const t0 = now();
  const assignments = [];
  for (const a of as) {
    const t = await db.one("SELECT * FROM attempts WHERE assignment_id=$1 AND student_id=$2", [a.id, s.id]);
    const n = a.mode === "adaptive" ? J(a.question_ids, []).length * 2 : J(a.question_ids, []).length;
    let status = "open";
    if (t && t.submitted_at) status = t.late ? "late" : "submitted";
    else if (t && t0 > t.deadline + GRACE_MS) status = "expired";
    else if (t) status = "in_progress";
    else if (a.due_at && t0 > a.due_at) status = "closed";
    assignments.push({
      id: a.id, title: a.title, subject: a.subject, domain: a.domain, questionCount: n, mode: a.mode || "standard",
      difficulty: a.difficulty, timeLimitMin: a.time_limit_min, dueAt: a.due_at, status, targeted: !!targetIds(a),
      correct: t?.submitted_at ? t.correct : null, score: t?.submitted_at ? (t.score ?? scaled(t.correct, t.total)) : null
    });
  }
  const mistakesCount = (await db.q("SELECT id FROM mistakes WHERE student_id=$1", [s.id])).length;
  const profile = await studentProfile(s);
  // оролцооны самбар
  const weekStart = addDays(today(), -6);
  const classmates = await db.q("SELECT id,name FROM students WHERE class_id=$1", [s.class_id]);
  const board = [];
  for (const m of classmates) {
    const act = await db.q("SELECT * FROM activity WHERE student_id=$1", [m.id]);
    board.push({ name: m.name, me: m.id === s.id, week: act.filter(a => a.day >= weekStart).reduce((x, a) => x + a.questions, 0) });
  }
  board.sort((a, b) => b.week - a.week);
  res.json({ student: { id: s.id, name: s.name }, class: c, assignments, mistakesCount, profile, board: board.slice(0, 10), serverTime: t0, today: today() });
}));

app.post("/api/student/goal", studentAuth, h(async (req, res) => {
  const { target, examDay } = req.body || {};
  const tg = Number(target);
  if (!(tg >= 400 && tg <= 1600)) return bad(res, 400, "Зорилтот оноо 400–1600 хооронд байна.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(examDay || "")) || examDay < today()) return bad(res, 400, "Шалгалтын ирээдүйн огноог сонгоно уу.");
  const ex = await db.one("SELECT * FROM student_goals WHERE student_id=$1", [req.userId]);
  if (ex) await db.q("UPDATE student_goals SET target=$1, exam_day=$2, updated_at=$3 WHERE student_id=$4", [tg, examDay, now(), req.userId]);
  else await db.q("INSERT INTO student_goals (student_id,target,exam_day,updated_at) VALUES ($1,$2,$3,$4)", [req.userId, tg, examDay, now()]);
  res.json({ ok: true });
}));

// Өдрийн дасгал: сул сэдвээс асуулт (хариутай, клиент дээр шалгана), дараа нь үр дүнг бүртгэнэ
app.get("/api/student/daily", studentAuth, h(async (req, res) => {
  const s = await db.one("SELECT * FROM students WHERE id=$1", [req.userId]);
  const p = await studentProfile(s);
  const subject = SUBJECTS[req.query.subject] ? req.query.subject : (p.weakest[0] || "M:alg").split(":")[0];
  const weakDoms = p.weakest.filter(k => k.startsWith(subject + ":")).map(k => k.split(":")[1]);
  const n = Math.max(5, Math.min(Number(req.query.count) || (p.plan ? Math.min(p.plan.daily, 15) : 10), 20));
  const c = await db.one("SELECT teacher_id FROM classes WHERE id=$1", [s.class_id]);
  const all = await sourcePool(c.teacher_id, subject, "all", "all", "all");
  const weak = shuffle(all.filter(q => weakDoms.includes(q.domain)));
  const other = shuffle(all.filter(q => !weakDoms.includes(q.domain)));
  const pick = [...weak.slice(0, Math.ceil(n * 0.6)), ...other].slice(0, n);
  res.json({ subject, weakDomains: weakDoms, questions: shuffle(pick).map(q => publicQ(q, true)) });
}));
app.post("/api/student/daily", studentAuth, h(async (req, res) => {
  const raw = (req.body && req.body.answers) || {};
  const ids = Object.keys(raw).slice(0, 40);
  const map = await qmapFor(ids);
  const answers = {};
  ids.forEach(id => { if (map[id] && Number.isInteger(raw[id])) answers[id] = raw[id]; });
  const valid = Object.keys(answers);
  const g = grade(valid, answers, map);
  const cleared = await updateMistakes(req.userId, valid, answers, map);
  await recordActivity(req.userId, valid.length, g.correct, cleared);
  res.json({ correct: g.correct, total: valid.length, cleared });
}));

async function studentAssignment(studentId, id) {
  const s = await db.one("SELECT * FROM students WHERE id=$1", [studentId]);
  const a = await db.one("SELECT * FROM assignments WHERE id=$1", [id]);
  if (!s || !a || a.class_id !== s.class_id || !isTarget(a, s.id)) return null;
  return { s, a };
}
app.post("/api/student/assignments/:id/start", studentAuth, h(async (req, res) => {
  const sa = await studentAssignment(req.userId, req.params.id);
  if (!sa) return bad(res, 404, "Даалгавар олдсонгүй.");
  const { s, a } = sa;
  let t = await db.one("SELECT * FROM attempts WHERE assignment_id=$1 AND student_id=$2", [a.id, s.id]);
  const t0 = now();
  if (t && t.submitted_at) return bad(res, 409, "Та энэ даалгаврыг аль хэдийн илгээсэн.");
  if (t && t0 > t.deadline + GRACE_MS) return bad(res, 410, "Даалгаврын хугацаа дууссан.");
  if (!t) {
    if (a.due_at && t0 > a.due_at) return bad(res, 410, "Даалгаврын хаагдах хугацаа өнгөрсөн.");
    let deadline = t0 + a.time_limit_min * 60000;
    if (a.due_at) deadline = Math.min(deadline, a.due_at);
    t = { id: uid(), started_at: t0, deadline, stage: a.mode === "adaptive" ? "m1" : null };
    await db.q("INSERT INTO attempts (id,assignment_id,student_id,started_at,deadline,stage) VALUES ($1,$2,$3,$4,$5,$6)", [t.id, a.id, s.id, t0, deadline, t.stage]);
  }
  const stage = a.mode === "adaptive" ? (t.stage || "m1") : null;
  const ids = stage === "m2" ? J(t.module2_ids, []) : J(a.question_ids, []);
  const map = await qmapFor(ids);
  res.json({
    assignment: { id: a.id, title: a.title, subject: a.subject, domain: a.domain, timeLimitMin: a.time_limit_min, mode: a.mode || "standard" },
    stage, startedAt: t.started_at, deadline: t.deadline, serverTime: t0,
    questions: ids.filter(id => map[id]).map(id => publicQ(map[id], false))
  });
}));
// Adaptive: 1-р модулийг илгээж, 2-р модулийг авна
app.post("/api/student/assignments/:id/module1", studentAuth, h(async (req, res) => {
  const sa = await studentAssignment(req.userId, req.params.id);
  if (!sa || sa.a.mode !== "adaptive") return bad(res, 404, "Даалгавар олдсонгүй.");
  const { s, a } = sa;
  const t = await db.one("SELECT * FROM attempts WHERE assignment_id=$1 AND student_id=$2", [a.id, s.id]);
  if (!t || t.submitted_at) return bad(res, 400, "Даалгавар идэвхгүй байна.");
  if (t.stage !== "m2") {
    const m1 = J(a.question_ids, []), map = await qmapFor(m1);
    const raw = (req.body && req.body.answers) || {}, answers = {};
    m1.forEach(id => { const v = raw[id]; if (Number.isInteger(v) && v >= 0 && v <= 3) answers[id] = v; });
    const g = grade(m1, answers, map);
    const hardPath = g.correct / m1.length >= 0.6;
    const ad = J(a.adaptive, { hard: [], easy: [] });
    await db.q("UPDATE attempts SET stage='m2', answers=$1, module2_ids=$2, adaptive_path=$3 WHERE id=$4",
      [JSON.stringify(answers), JSON.stringify(hardPath ? ad.hard : ad.easy), hardPath ? "hard" : "easy", t.id]);
  }
  const t2 = await db.one("SELECT * FROM attempts WHERE id=$1", [t.id]);
  const ids = J(t2.module2_ids, []), map2 = await qmapFor(ids);
  res.json({ stage: "m2", deadline: t2.deadline, serverTime: now(), questions: ids.filter(id => map2[id]).map(id => publicQ(map2[id], false)) });
}));
app.post("/api/student/assignments/:id/submit", studentAuth, h(async (req, res) => {
  const sa = await studentAssignment(req.userId, req.params.id);
  if (!sa) return bad(res, 404, "Даалгавар олдсонгүй.");
  const { s, a } = sa;
  const t = await db.one("SELECT * FROM attempts WHERE assignment_id=$1 AND student_id=$2", [a.id, s.id]);
  if (!t) return bad(res, 400, "Даалгаврыг эхлүүлээгүй байна.");
  const m1 = J(a.question_ids, []);
  const ids = a.mode === "adaptive" ? [...m1, ...J(t.module2_ids, [])] : m1;
  const map = await qmapFor(ids);
  const valid = ids.filter(id => map[id]);
  if (!t.submitted_at) {
    const raw = (req.body && req.body.answers) || {};
    const answers = a.mode === "adaptive" ? J(t.answers, {}) : {};
    const accept = a.mode === "adaptive" && t.stage === "m2" ? J(t.module2_ids, []) : valid;
    accept.forEach(id => { const v = raw[id]; if (Number.isInteger(v) && v >= 0 && v <= 3) answers[id] = v; });
    const g = grade(valid, answers, map);
    let score = scaled(g.correct, valid.length);
    if (a.mode === "adaptive") {
      const m2 = J(t.module2_ids, []);
      const g1 = grade(m1, answers, map), g2 = grade(m2, answers, map);
      score = adaptiveScore(g1.correct, m1.length, g2.correct, m2.length, t.adaptive_path === "hard");
    }
    const t0 = now();
    const late = t0 > t.deadline + GRACE_MS;
    await db.q("UPDATE attempts SET submitted_at=$1, answers=$2, correct=$3, total=$4, by_domain=$5, late=$6, score=$7, stage='done' WHERE id=$8",
      [t0, JSON.stringify(answers), g.correct, valid.length, JSON.stringify(g.byDomain), late, score, t.id]);
    const cleared = await updateMistakes(s.id, valid, answers, map);
    await recordActivity(s.id, valid.length, g.correct, cleared);
  }
  const done = await db.one("SELECT * FROM attempts WHERE id=$1", [t.id]);
  res.json({
    correct: done.correct, total: done.total, score: done.score ?? scaled(done.correct, done.total), late: done.late, path: done.adaptive_path,
    seconds: Math.round((done.submitted_at - done.started_at) / 1000),
    byDomain: J(done.by_domain, {}), answers: J(done.answers, {}),
    questions: valid.map(id => publicQ(map[id], true))
  });
}));

// алдааны дэвтэр
app.get("/api/student/mistakes", studentAuth, h(async (req, res) => {
  const rows = await db.q("SELECT * FROM mistakes WHERE student_id=$1 ORDER BY updated_at", [req.userId]);
  const map = await qmapFor(rows.map(r => r.question_id));
  res.json({ mastered: MASTERED, items: rows.filter(r => map[r.question_id]).map(r => ({ streak: r.streak, question: publicQ(map[r.question_id], false) })) });
}));
app.post("/api/student/mistakes/check", studentAuth, h(async (req, res) => {
  const { questionId, choice } = req.body || {};
  const mid = req.userId + ":" + questionId;
  const ex = await db.one("SELECT * FROM mistakes WHERE id=$1", [mid]);
  if (!ex) return bad(res, 404, "Энэ асуулт дэвтэрт алга.");
  const q = (await qmapFor([questionId]))[questionId];
  if (!q) return bad(res, 404, "Асуулт олдсонгүй.");
  const ok = choice === q.answer;
  const streak = ok ? ex.streak + 1 : 0;
  let removed = false;
  if (ok && streak >= MASTERED) { await db.q("DELETE FROM mistakes WHERE id=$1", [mid]); removed = true; }
  else await db.q("UPDATE mistakes SET streak=$1, updated_at=$2 WHERE id=$3", [streak, now(), mid]);
  await recordActivity(req.userId, 1, ok ? 1 : 0, removed ? 1 : 0);
  res.json({ correct: ok, streak, removed, question: publicQ(q, true) });
}));

// шууд асуулт
app.get("/api/student/live", studentAuth, h(async (req, res) => {
  const s = await db.one("SELECT * FROM students WHERE id=$1", [req.userId]);
  const sess = (await db.q("SELECT * FROM live_sessions WHERE class_id=$1 AND state<>'ended' ORDER BY created_at DESC", [s.class_id]))
    .find(x => now() - x.updated_at < 3 * 3600 * 1000);
  if (!sess) return res.json({ live: null });
  const st = await liveState(sess, false);
  const mine = await db.one("SELECT * FROM live_answers WHERE id=$1", [`${sess.id}:${s.id}:${sess.idx}`]);
  res.json({ live: { ...st, myChoice: mine ? mine.choice : null } });
}));
app.post("/api/student/live/answer", studentAuth, h(async (req, res) => {
  const { sessionId, idx, choice } = req.body || {};
  const s = await db.one("SELECT * FROM students WHERE id=$1", [req.userId]);
  const sess = await db.one("SELECT * FROM live_sessions WHERE id=$1", [sessionId]);
  if (!sess || sess.class_id !== s.class_id) return bad(res, 404, "Олдсонгүй.");
  if (sess.state !== "question" || sess.idx !== Number(idx)) return bad(res, 409, "Энэ асуултын хариулах хугацаа дууссан.");
  if (![0, 1, 2, 3].includes(Number(choice))) return bad(res, 400, "Хариултаа сонгоно уу.");
  const id = `${sess.id}:${s.id}:${sess.idx}`;
  const first = !(await db.one("SELECT id FROM live_answers WHERE id=$1", [id]));
  if (!first) await db.q("UPDATE live_answers SET choice=$1, answered_at=$2 WHERE id=$3", [Number(choice), now(), id]);
  else await db.q("INSERT INTO live_answers (id,session_id,student_id,idx,choice,answered_at) VALUES ($1,$2,$3,$4,$5,$6)", [id, sess.id, s.id, sess.idx, Number(choice), now()]);
  if (first) await recordActivity(s.id, 1, 0, 0);
  res.json({ ok: true });
}));

app.use("/api", (req, res) => bad(res, 404, "Ийм хаяг алга."));
app.use((err, req, res, next) => { console.error(err); bad(res, 500, "Серверт алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу."); });

db.init().then(() => {
  app.listen(PORT, () => console.log(`Оноо1600 ажиллаж байна: http://localhost:${PORT}`));
}).catch(e => { console.error("Мэдээллийн сантай холбогдож чадсангүй:", e); process.exit(1); });
