// Мэдээллийн сан: DATABASE_URL байвал PostgreSQL, байхгүй бол туршилтын санах ой (pg-mem).
let pool;
let inMemory = false;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS teachers (
     id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
     pass_hash TEXT NOT NULL, created_at BIGINT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS classes (
     id TEXT PRIMARY KEY, teacher_id TEXT NOT NULL, name TEXT NOT NULL,
     code TEXT NOT NULL UNIQUE, created_at BIGINT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS class_teachers (
     id TEXT PRIMARY KEY, class_id TEXT NOT NULL, teacher_id TEXT NOT NULL, created_at BIGINT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS students (
     id TEXT PRIMARY KEY, class_id TEXT NOT NULL, name TEXT NOT NULL,
     pin_hash TEXT NOT NULL, created_at BIGINT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS sessions (
     token TEXT PRIMARY KEY, kind TEXT NOT NULL, user_id TEXT NOT NULL, created_at BIGINT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS assignments (
     id TEXT PRIMARY KEY, class_id TEXT NOT NULL, title TEXT NOT NULL,
     subject TEXT NOT NULL, domain TEXT NOT NULL, question_ids TEXT NOT NULL,
     time_limit_min INTEGER NOT NULL, due_at BIGINT, created_at BIGINT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS attempts (
     id TEXT PRIMARY KEY, assignment_id TEXT NOT NULL, student_id TEXT NOT NULL,
     started_at BIGINT NOT NULL, deadline BIGINT NOT NULL, submitted_at BIGINT,
     answers TEXT, correct INTEGER, total INTEGER, by_domain TEXT, late BOOLEAN)`,
  `CREATE TABLE IF NOT EXISTS custom_questions (
     id TEXT PRIMARY KEY, teacher_id TEXT NOT NULL, subject TEXT NOT NULL, domain TEXT NOT NULL,
     data TEXT NOT NULL, created_at BIGINT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS mistakes (
     id TEXT PRIMARY KEY, student_id TEXT NOT NULL, question_id TEXT NOT NULL,
     streak INTEGER NOT NULL, updated_at BIGINT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS activity (
     id TEXT PRIMARY KEY, student_id TEXT NOT NULL, day TEXT NOT NULL,
     questions INTEGER NOT NULL, correct INTEGER NOT NULL, cleared INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS student_goals (
     student_id TEXT PRIMARY KEY, target INTEGER NOT NULL, exam_day TEXT NOT NULL, updated_at BIGINT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS recurring (
     id TEXT PRIMARY KEY, class_id TEXT NOT NULL, title TEXT NOT NULL, subject TEXT NOT NULL, domain TEXT NOT NULL,
     difficulty TEXT, q_count INTEGER NOT NULL, time_limit_min INTEGER NOT NULL,
     run_weekday INTEGER NOT NULL, run_hour INTEGER NOT NULL, days_open INTEGER NOT NULL,
     last_run_day TEXT, created_at BIGINT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS live_sessions (
     id TEXT PRIMARY KEY, class_id TEXT NOT NULL, title TEXT NOT NULL, question_ids TEXT NOT NULL,
     idx INTEGER NOT NULL, state TEXT NOT NULL, created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS live_answers (
     id TEXT PRIMARY KEY, session_id TEXT NOT NULL, student_id TEXT NOT NULL,
     idx INTEGER NOT NULL, choice INTEGER NOT NULL, answered_at BIGINT NOT NULL)`
];

// Хуучин мэдээллийн санд шинэ багана нэмэх (аль хэдийн байвал алгасна).
const COLUMNS = [
  ["teachers", "recovery_hash", "TEXT"],
  ["assignments", "difficulty", "TEXT"],
  ["assignments", "student_ids", "TEXT"],
  ["assignments", "mode", "TEXT"],
  ["assignments", "adaptive", "TEXT"],
  ["attempts", "stage", "TEXT"],
  ["attempts", "module2_ids", "TEXT"],
  ["attempts", "adaptive_path", "TEXT"],
  ["attempts", "score", "INTEGER"]
];

async function addColumn(table, col, type) {
  try { await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col} ${type}`); return; } catch (e) {}
  try { await pool.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`); } catch (e) { /* аль хэдийн бий */ }
}

async function init() {
  if (process.env.DATABASE_URL) {
    const { Pool } = require("pg");
    const ssl = process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false };
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl });
  } else {
    const { newDb } = require("pg-mem");
    const mem = newDb();
    const { Pool } = mem.adapters.createPg();
    pool = new Pool();
    inMemory = true;
    console.warn("⚠  DATABASE_URL тохируулаагүй — түр санах ой ашиглаж байна. Сервер унтрахад өгөгдөл устна.");
  }
  for (const s of SCHEMA) await pool.query(s);
  for (const [t, c, ty] of COLUMNS) await addColumn(t, c, ty);
}

// BIGINT утгыг pg тэмдэгт мөрөөр буцаадаг тул тоо болгоно.
const NUM_FIELDS = ["created_at", "due_at", "started_at", "deadline", "submitted_at", "time_limit_min", "correct", "total",
  "streak", "updated_at", "questions", "cleared", "target", "q_count", "run_weekday", "run_hour", "days_open",
  "idx", "choice", "answered_at", "score"];
function fix(row) {
  for (const f of NUM_FIELDS) if (row[f] !== null && row[f] !== undefined) row[f] = Number(row[f]);
  return row;
}

async function q(text, params = []) {
  const r = await pool.query(text, params);
  return r.rows.map(fix);
}
async function one(text, params = []) {
  return (await q(text, params))[0] || null;
}

module.exports = { init, q, one, isInMemory: () => inMemory };
