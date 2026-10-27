// Нийтлэг: хэл солих, API дуудлага, асуулт харуулах.
const I18N = {
  mn: {
    nav_tips: "Зөвлөгөө", tips_teaser_t: "SAT-д бэлтгэх зөвлөгөө", tips_teaser_p: "Шалгалтын бүтэц, 3 сарын бэлтгэлийн хуваарь, хэсэг бүрийн арга барил, шалгалтын өдрийн жагсаалт.", tips_teaser_b: "Зөвлөгөө унших →",
    nav_practice: "Дасгал", nav_student: "Сурагч", nav_teacher: "Багш", nav_links: "Холбоосууд",
    hero_eyebrow: "Digital SAT · Математик ба Англи хэл",
    hero_title: "Ангиараа SAT‑д хамт бэлдье",
    hero_lead: "Сурагч дасгал хийж, багшийн өгсөн хугацаатай даалгаврыг гүйцэтгэнэ. Үр дүн нь багшид шууд очиж, сэдэв бүрээр шинжлэгдэнэ.",
    hero_practice: "Үнэгүй дасгал хийх →",
    role_student_t: "Сурагч", role_student_p: "Багшаас авсан ангийн кодоор нэвтэрч даалгавраа хийнэ.", role_student_b: "Сурагчаар нэвтрэх",
    role_teacher_t: "Багш", role_teacher_p: "Анги үүсгэж, хугацаатай даалгавар өгөөд дүнг хянана.", role_teacher_b: "Багшаар нэвтрэх",
    practice_eyebrow: "Хэн ч ашиглана", practice_title: "Дасгал",
    practice_lead: "Хичээл, сэдвээ сонго. Хариулаад «Шалгах» дарвал тайлбар гарна. Хэлийг дээд буланд сольж болно.",
    lab_subject: "Хичээл", lab_topic: "Сэдэв", mixed: "Холимог",
    q_of: "Асуулт", prev: "← Өмнөх", next: "Дараах →", check: "Шалгах", see_results: "Дүн харах", back_results: "Дүн рүү буцах",
    correct: "Зөв!", correct_answer: "Зөв хариулт", answer: "Хариулт",
    time_spent: "Зарцуулсан хугацаа", time_left: "Үлдсэн хугацаа", answer_sheet: "Хариултын хуудас",
    finish: "Дуусгаж илгээх", finish_practice: "Дуусгаж дүн харах",
    desmos_note: "Бодит шалгалтын Math хэсэгт Desmos тооны машин суулгагдсан байдаг.", desmos_open: "Desmos нээх",
    est_score: "Тооцоолсон оноо (200–800)", by_topic: "Сэдвээр",
    approx: "Цөөн асуултаас гаргасан ойролцоо үзүүлэлт. Бодит оноогоо Bluebook-ийн бүрэн тестээр шалгаарай.",
    next_step: "Дараагийн алхам:", redo_topics: "сэдвийн дасгалыг дахин хий.", well_done: "Сайн байна!", well_done_p: "Өөр сэдэв эсвэл холимог тест рүү шилж.",
    review: "Хариултаа харах", retry: "Дахин эхлэх",
    vocab_eyebrow: "Англи хэл", vocab_title: "SAT-ийн үгсийн сан", vocab_lead: "Картыг дарж эргүүл. «Мэднэ» гэсэн үг цаашид цөөн давтагдана.",
    flip_hint: "Дарж утгыг харах", again: "Давтах", know: "Мэднэ ✓", learned: "Цээжилсэн", restart: "Дахин эхлүүлэх",
    formula_eyebrow: "Математик", formula_title: "Томьёоны хуудас", formula_lead: "Digital SAT-ийн Math хэсэгт өгөгддөг лавлах томьёонууд.",
    links_eyebrow: "Албан ёсны эх сурвалж", links_title: "Хэрэгтэй холбоосууд", links_lead: "Бүгд үнэгүй. Шинэ цонхонд нээгдэнэ.",
    links_students: "Сурагчдад", links_teachers: "Багш нарт", links_reg: "Бүртгэл ба зөвлөгөө",
    footer: "Оноо1600 · SAT нь College Board-ийн бүртгэлтэй тэмдэг бөгөөд энэ сайттай холбоогүй. Асуултууд эх зохиомол, тооцоолсон оноо ойролцоо.",
    // student
    st_join_title: "Ангидаа нэвтрэх", st_join_lead: "Багшаас авсан 6 оронтой ангийн код, өөрийн нэр, 4 оронтой PIN-ээ оруулна. Дараа нь өөр төхөөрөмжөөс ижил нэр, PIN-ээр нэвтэрнэ.",
    class_code: "Ангийн код", full_name: "Овог нэр", pin: "PIN (4 оронтой тоо)", join: "Нэвтрэх", logout: "Гарах",
    my_assignments: "Миний даалгаврууд", no_assignments: "Одоогоор даалгавар алга. Багш даалгавар өгөхөд энд гарна.",
    questions: "асуулт", minutes: "мин", due: "Хаагдах", start: "Эхлэх", resume: "Үргэлжлүүлэх",
    st_open: "Хийх", st_in_progress: "Хийж байна", st_submitted: "Илгээсэн", st_late: "Хоцорч илгээсэн", st_expired: "Хугацаа дууссан", st_closed: "Хаагдсан", st_not_started: "Эхлээгүй",
    confirm_start: "Эхлэхэд цаг явж эхэлнэ. Цаг дуусахад хариулт автоматаар илгээгдэнэ.",
    confirm_submit: "Дахин дарж илгээхийг баталгаажуулна уу", unanswered: "хариулаагүй асуулт байна.",
    sent_ok: "Үр дүн багшид илгээгдлээ.", sent_late: "Хугацаа хэтэрсэн тул «хоцорсон» гэж тэмдэглэгдэв.",
    back_list: "← Даалгаврууд руу", auto_submit: "Хугацаа дууслаа. Хариулт автоматаар илгээгдэж байна…",
    net_retry: "Илгээж чадсангүй. Интернэтээ шалгаад «Дуусгаж илгээх»-ийг дахин дарна уу.",
    // teacher
    t_login: "Нэвтрэх", t_register: "Бүртгүүлэх", email: "Имэйл", password: "Нууц үг", your_name: "Таны нэр", invite_code: "Багшийн урилгын код",
    t_classes: "Миний ангиуд", t_new_class: "Шинэ анги", class_name: "Ангийн нэр", create: "Үүсгэх",
    students_n: "сурагч", t_share_code: "Сурагчдад өгөх код", t_open_student: "Сурагчийн хуудас",
    t_new_assign: "Даалгавар өгөх", title: "Гарчиг", q_count: "Асуултын тоо", time_limit: "Хугацаа (минут)", due_at: "Хаагдах огноо, цаг",
    publish: "Даалгавар нийтлэх", t_assigns: "Даалгаврууд", submitted_n: "илгээсэн", results: "Дүн", delete: "Устгах", confirm_delete: "Баталгаажуулах",
    t_students: "Сурагчид", t_no_students: "Сурагч алга. Ангийн кодоо сурагчдадаа өгнө үү.", remove: "Хасах",
    t_results_title: "Даалгаврын дүн", t_avg: "Дундаж", t_submitted: "Илгээсэн", t_not_sub: "Илгээгээгүй",
    col_student: "Сурагч", col_status: "Төлөв", col_correct: "Зөв", col_score: "Оноо", col_time: "Хугацаа", col_weak: "Сул сэдэв", col_sent: "Илгээсэн",
    q_analysis: "Асуулт тус бүрээр", csv: "CSV татах", project: "Ангид том дэлгэцээр үзүүлэх", reveal: "Хариу нээх", close: "Хаах ✕",
    auto_refresh: "Дүн 15 секунд тутам автоматаар шинэчлэгдэнэ.", no_classes: "Анги алга. Эхлээд анги үүсгэнэ үү.",
    demo_db: "Туршилтын горим: сервер дахин эхлэхэд өгөгдөл устна. Render дээр DATABASE_URL тохируулна уу.",
    all_topics: "Бүх сэдэв (холимог)", choose_class: "Анги сонгох",
    mist_title: "Алдааны дэвтэр", mist_lead: "Даалгаварт алдсан асуултууд энд хуримтлагдана. Дараалан 2 удаа зөв хийвэл дэвтрээс гарна.",
    mist_open: "Алдаагаа засах", mist_empty: "Алдааны дэвтэр хоосон байна. Сайн байна!", mist_done: "Бүх алдаагаа засаж дууслаа!",
    mist_progress: "Дараалан зөв", mist_removed: "Энэ асуулт дэвтрээс гарлаа.", mist_left: "үлдсэн",
    an_title: "Ангийн шинжилгээ", an_lead: "Илгээсэн бүх даалгаврын нэгтгэл. Хамгийн сул сэдэв дээрээ байна.", an_empty: "Шинжилгээ гарахын тулд сурагчид дор хаяж нэг даалгавар илгээсэн байх хэрэгтэй.",
    an_struggling: "60%-иас доош", an_assign: "Энэ сэдвээр даалгавар өгөх", an_hardest: "Хамгийн их алддаг асуултууд", an_attempts: "илгээлт",
    an_prefill: "Маягт бөглөгдлөө. Хугацаа, огноогоо шалгаад нийтэлнэ үү.", an_review: "давтлага",
    qb_title: "Миний асуултын сан", qb_lead: "Өөрийн асуултаа нэмээд даалгаварт ашиглана. Монгол хувилбар заавал биш.",
    qb_builtin: "Суурь сан", qb_mine: "Миний асуулт", qb_add: "Асуулт нэмэх", qb_q_en: "Асуулт (англи)", qb_q_mn: "Асуулт (монгол)",
    qb_passage: "Эх текст (заавал биш)", qb_opts_en: "Хувилбарууд (англи)", qb_opts_mn: "Хувилбарууд (монгол, заавал биш)",
    qb_answer: "Зөв хариулт", qb_e_en: "Тайлбар (англи)", qb_e_mn: "Тайлбар (монгол)", qb_saved: "Асуулт нэмэгдлээ.", qb_empty: "Одоогоор өөрийн асуулт алга.",
    source: "Асуултын эх үүсвэр", src_all: "Суурь сан + миний асуулт", src_builtin: "Зөвхөн суурь сан", src_mine: "Зөвхөн миний асуулт"
  },
  en: {
    nav_tips: "Tips", tips_teaser_t: "How to prepare for the SAT", tips_teaser_p: "Test format, a 3-month study timeline, strategies for each section, and a test-day checklist.", tips_teaser_b: "Read the tips →",
    nav_practice: "Practice", nav_student: "Student", nav_teacher: "Teacher", nav_links: "Links",
    hero_eyebrow: "Digital SAT · Math and Reading & Writing",
    hero_title: "Prepare for the SAT together as a class",
    hero_lead: "Students practice and complete timed assignments from their teacher. Results go straight to the teacher, broken down by topic.",
    hero_practice: "Start free practice →",
    role_student_t: "Student", role_student_p: "Join with the class code from your teacher and complete assignments.", role_student_b: "Student sign-in",
    role_teacher_t: "Teacher", role_teacher_p: "Create classes, set timed assignments and track results.", role_teacher_b: "Teacher sign-in",
    practice_eyebrow: "Open to everyone", practice_title: "Practice",
    practice_lead: "Choose a subject and topic. Answer, then press Check to see the explanation. Switch the language in the top corner.",
    lab_subject: "Subject", lab_topic: "Topic", mixed: "Mixed",
    q_of: "Question", prev: "← Back", next: "Next →", check: "Check", see_results: "See results", back_results: "Back to results",
    correct: "Correct!", correct_answer: "Correct answer", answer: "Answer",
    time_spent: "Time spent", time_left: "Time left", answer_sheet: "Answer sheet",
    finish: "Finish and submit", finish_practice: "Finish and see results",
    desmos_note: "The real Math section has a built-in Desmos calculator.", desmos_open: "Open Desmos",
    est_score: "Estimated score (200–800)", by_topic: "By topic",
    approx: "A rough estimate from a few questions. Check your real score with a full Bluebook practice test.",
    next_step: "Next step:", redo_topics: "— practice these topics again.", well_done: "Well done!", well_done_p: "Move on to another topic or a mixed test.",
    review: "Review answers", retry: "Start over",
    vocab_eyebrow: "English", vocab_title: "SAT vocabulary", vocab_lead: "Tap a card to flip it. Words you mark as known come up less often.",
    flip_hint: "Tap to see the meaning", again: "Again", know: "I know it ✓", learned: "Learned", restart: "Reset",
    formula_eyebrow: "Math", formula_title: "Reference sheet", formula_lead: "The reference formulas provided in the Digital SAT Math section.",
    links_eyebrow: "Official resources", links_title: "Useful links", links_lead: "All free. Links open in a new tab.",
    links_students: "For students", links_teachers: "For teachers", links_reg: "Registration and advising",
    footer: "Onoo1600 · SAT is a registered trademark of the College Board, which is not affiliated with this site. Questions are original; scores are estimates.",
    st_join_title: "Join your class", st_join_lead: "Enter the 6-character class code from your teacher, your name and a 4-digit PIN. Use the same name and PIN to sign in on another device.",
    class_code: "Class code", full_name: "Full name", pin: "PIN (4 digits)", join: "Join", logout: "Sign out",
    my_assignments: "My assignments", no_assignments: "No assignments yet. They will appear here when your teacher posts one.",
    questions: "questions", minutes: "min", due: "Closes", start: "Start", resume: "Resume",
    st_open: "To do", st_in_progress: "In progress", st_submitted: "Submitted", st_late: "Submitted late", st_expired: "Time ran out", st_closed: "Closed", st_not_started: "Not started",
    confirm_start: "The timer starts when you begin. When time runs out, your answers are submitted automatically.",
    confirm_submit: "Press again to confirm submission", unanswered: "unanswered question(s).",
    sent_ok: "Your results were sent to your teacher.", sent_late: "Submitted after the time limit, so it is marked late.",
    back_list: "← Back to assignments", auto_submit: "Time is up. Submitting your answers…",
    net_retry: "Could not submit. Check your connection and press Finish and submit again.",
    t_login: "Sign in", t_register: "Create account", email: "Email", password: "Password", your_name: "Your name", invite_code: "Teacher invite code",
    t_classes: "My classes", t_new_class: "New class", class_name: "Class name", create: "Create",
    students_n: "students", t_share_code: "Code for students", t_open_student: "Student page",
    t_new_assign: "New assignment", title: "Title", q_count: "Number of questions", time_limit: "Time limit (minutes)", due_at: "Closes at",
    publish: "Post assignment", t_assigns: "Assignments", submitted_n: "submitted", results: "Results", delete: "Delete", confirm_delete: "Confirm",
    t_students: "Students", t_no_students: "No students yet. Share the class code with your students.", remove: "Remove",
    t_results_title: "Assignment results", t_avg: "Average", t_submitted: "Submitted", t_not_sub: "Not submitted",
    col_student: "Student", col_status: "Status", col_correct: "Correct", col_score: "Score", col_time: "Time", col_weak: "Weak topic", col_sent: "Submitted",
    q_analysis: "By question", csv: "Download CSV", project: "Show on classroom screen", reveal: "Reveal answer", close: "Close ✕",
    auto_refresh: "Results refresh automatically every 15 seconds.", no_classes: "No classes yet. Create one first.",
    demo_db: "Demo mode: data is lost when the server restarts. Set DATABASE_URL on Render.",
    all_topics: "All topics (mixed)", choose_class: "Choose class",
    mist_title: "Mistake notebook", mist_lead: "Questions you missed on assignments collect here. Get one right twice in a row to clear it.",
    mist_open: "Fix my mistakes", mist_empty: "Your mistake notebook is empty. Nice work!", mist_done: "All mistakes fixed!",
    mist_progress: "Correct in a row", mist_removed: "This question is cleared from your notebook.", mist_left: "left",
    an_title: "Class analysis", an_lead: "Combined results from every submitted assignment. Weakest topics first.", an_empty: "Analysis appears once students have submitted at least one assignment.",
    an_struggling: "Below 60%", an_assign: "Assign this topic", an_hardest: "Most-missed questions", an_attempts: "submissions",
    an_prefill: "The form is filled in. Check the time limit and date, then post.", an_review: "review",
    qb_title: "My question bank", qb_lead: "Add your own questions and use them in assignments. The Mongolian version is optional.",
    qb_builtin: "Built-in", qb_mine: "My questions", qb_add: "Add question", qb_q_en: "Question (English)", qb_q_mn: "Question (Mongolian)",
    qb_passage: "Passage (optional)", qb_opts_en: "Choices (English)", qb_opts_mn: "Choices (Mongolian, optional)",
    qb_answer: "Correct answer", qb_e_en: "Explanation (English)", qb_e_mn: "Explanation (Mongolian)", qb_saved: "Question added.", qb_empty: "No questions of your own yet.",
    source: "Question source", src_all: "Built-in + mine", src_builtin: "Built-in only", src_mine: "My questions only"
  }
};

let LANG = (() => { try { return localStorage.getItem("o16lang") || "mn"; } catch (e) { return "mn"; } })();
const t = k => (I18N[LANG] && I18N[LANG][k]) || I18N.mn[k] || k;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
const scaled = (c, n) => (n ? Math.round((200 + (600 * c) / n) / 10) * 10 : 200);
const L = "ABCD";
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};

const langListeners = [];
function onLang(fn) { langListeners.push(fn); }
function applyI18n() {
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-ph]").forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll(".langseg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === LANG));
}
function setLang(l) {
  LANG = l; try { localStorage.setItem("o16lang", l); } catch (e) {}
  applyI18n(); langListeners.forEach(fn => fn());
}

function renderHeader(active) {
  const el = document.querySelector("header.top");
  el.innerHTML = `<div class="wrap">
    <a class="logo" href="/"><span class="dot"></span>Оноо1600</a>
    <nav>
      <a href="/#practice" class="hide-sm" data-i18n="nav_practice"></a>
      <a href="/student" ${active === "student" ? 'aria-current="page"' : ""} data-i18n="nav_student"></a>
      <a href="/teacher" ${active === "teacher" ? 'aria-current="page"' : ""} data-i18n="nav_teacher"></a>
      <a href="/tips" ${active === "tips" ? 'aria-current="page"' : ""} data-i18n="nav_tips"></a>
      <a href="/#links" class="hide-sm" data-i18n="nav_links"></a>
    </nav>
    <div class="seg langseg" role="group" aria-label="Language">
      <button type="button" data-lang="mn">МОН</button><button type="button" data-lang="en">ENG</button>
    </div></div>`;
  el.querySelectorAll(".langseg button").forEach(b => b.onclick = () => setLang(b.dataset.lang));
}

async function api(path, opts = {}, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  const res = await fetch(path, { method: opts.method || "GET", headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) { const err = new Error((data && data.error) || "Алдаа гарлаа."); err.status = res.status; throw err; }
  return data;
}

let META = null;
async function loadMeta() { if (!META) META = await api("/api/meta"); return META; }
const subjName = s => META ? META.subjects[s][LANG] : s;
const domName = (s, d) => d === "all" ? t("mixed") : (META && META.subjects[s].domains[d] ? META.subjects[s].domains[d][LANG] : d);

// Асуултын текстийг сонгосон хэлээр.
function qf(q, field) {
  if (field === "options") return (LANG === "mn" && q.options_mn) ? q.options_mn : q.options_en;
  const mn = q[field + "_mn"], en = q[field + "_en"];
  return LANG === "mn" ? (mn || en) : en;
}

// Нэг асуултын HTML. state: {sel, revealed}
function questionHTML(q, i, total, state) {
  const sel = state.sel, rev = state.revealed;
  let h = `<div class="qmeta"><span class="eyebrow">${t("q_of")} ${i + 1} / ${total} · ${esc(subjName(q.subject))}</span><span class="btns" style="gap:6px"><span class="chip diffchip d${q.difficulty || 2}" title="${esc(t("diff"))}">${diffDots(q.difficulty)} ${esc(diffLabel(q.difficulty))}</span><span class="chip">${esc(domName(q.subject, q.domain))}</span></span></div>`;
  const passage = qf(q, "passage");
  if (passage) h += `<p class="passage">${esc(passage)}</p>`;
  h += `<p class="qtext">${esc(qf(q, "q"))}</p><div class="opts">`;
  qf(q, "options").forEach((o, k) => {
    let c = "opt";
    if (rev && q.answer !== undefined) { if (k === q.answer) c += " right"; else if (k === sel) c += " wrong"; }
    else if (sel === k) c += " sel";
    h += `<button type="button" class="${c}" data-k="${k}" ${rev ? "disabled" : ""} aria-pressed="${sel === k}"><span class="bub">${L[k]}</span><span>${esc(o)}</span></button>`;
  });
  h += `</div>`;
  if (rev && q.answer !== undefined) {
    const head = sel === q.answer ? t("correct") : (sel === null || sel === undefined ? `${t("answer")}: ${L[q.answer]}.` : `${t("correct_answer")}: ${L[q.answer]}.`);
    h += `<div class="explain"><b>${esc(head)}</b> ${esc(qf(q, "e"))}</div>`;
  }
  return h;
}

function topicRows(subject, byDomain) {
  return Object.entries(byDomain).map(([d, [c, n]]) => {
    const p = n ? c / n : 0, cls = p >= .8 ? "good" : p >= .5 ? "mid" : "weak";
    return `<div class="trow"><span>${esc(domName(subject, d))}</span><div class="bar"><i class="${cls}" style="width:${Math.max(6, p * 100)}%"></i></div><span>${c}/${n}</span></div>`;
  }).join("");
}
function weakTopics(subject, byDomain) {
  return Object.entries(byDomain).filter(([d, [c, n]]) => n && c / n < .67).map(([d]) => domName(subject, d));
}
const pillClass = p => p >= .8 ? "ok" : p >= .5 ? "mid" : "bad";

// ================= v3 нэмэлтүүд =================
Object.assign(I18N.mn, {
  diff: "Түвшин", diff_all: "Бүх түвшин", diff_1: "Хялбар", diff_2: "Дунд", diff_3: "Хүнд",
  mode: "Төрөл", mode_standard: "Энгийн тест", mode_adaptive: "Бодит SAT (2 модуль, adaptive)",
  adaptive_hint: "1-р модулийн дүнгээс хамаарч 2-р модуль хүнд эсвэл хялбар болно. Асуултын тоог 2 модульд тэнцүү хуваана.",
  module: "Модуль", module_next: "1-р модулийг дуусгаж 2-р модуль руу", module2_hard: "2-р модуль: хүнд", module2_easy: "2-р модуль: хялбар",
  path_hard: "Хүнд зам", path_easy: "Хялбар зам",
  // сурагчийн самбар
  goal_title: "Миний зорилго", goal_target: "Зорилтот нийт оноо", goal_date: "Шалгалтын огноо", goal_save: "Хадгалах",
  goal_none: "Зорилтот оноо, шалгалтын огноогоо оруулбал өдөр бүрийн төлөвлөгөө гарна.",
  days_left: "өдөр үлдлээ", est_now: "Одоогийн тооцоо", gap: "Дутуу", daily_goal: "Өнөөдрийн зорилт", q_today: "асуулт",
  daily_start: "Өдрийн дасгал эхлэх", daily_title: "Өдрийн дасгал", daily_lead: "Сул сэдвүүдээс чинь сонгосон асуултууд.", daily_done: "Өдрийн дасгал дууслаа!",
  streak: "Дараалсан өдөр", best: "Дээд", badges: "Тэмдэгүүд", no_badges: "Даалгавар, дасгал хийгээд тэмдэг цуглуулаарай.",
  progress: "Миний явц", no_history: "Даалгавар илгээхэд оноо тань энд графикаар харагдана.",
  board_title: "Энэ 7 хоногийн идэвх", board_lead: "Хийсэн асуултын тоо. Оноо биш, оролцоо.", you: "Та",
  b_first: "Эхний алхам", b_streak3: "3 өдөр дараалан", b_streak7: "7 хоног дараалан", b_perfect: "Алдаагүй", b_hundred: "100 асуулт", b_cleaner: "Дэвтэр цэвэрлэгч", b_master: "мастер",
  live_banner: "Багш шууд асуулт эхлүүллээ!", live_join: "Нэгдэх", live_title: "Шууд асуулт", live_wait: "Багш дараагийн асуултыг нээхийг хүлээж байна…",
  live_sent: "Хариулт илгээгдлээ. Багш хариуг нээхийг хүлээнэ үү.", live_ended: "Шууд асуулт дууслаа.",
  offline: "Интернэт тасарсан. Хариултууд тань хадгалагдсан, холбогдмогц автоматаар илгээгдэнэ.", pending_sent: "Хадгалагдсан хариулт амжилттай илгээгдлээ.",
  targeted: "Танд зориулсан",
  // багш
  t_forgot: "Нууц үгээ мартсан", recovery_code: "Сэргээх код", new_password: "Шинэ нууц үг", reset_btn: "Нууц үг шинэчлэх",
  recovery_show: "Энэ сэргээх кодыг хадгалж аваарай. Нууц үгээ мартвал зөвхөн энэ кодоор сэргээнэ:", recovery_ok: "Хадгалсан",
  account: "Бүртгэл", change_pw: "Нууц үг солих", current_pw: "Одоогийн нууц үг", new_recovery: "Шинэ сэргээх код авах", saved: "Хадгалагдлаа.",
  co_teachers: "Хамтран ажиллах багш", co_add: "Нэмэх", co_email: "Багшийн имэйл", owner: "эзэн",
  followup: "Сул сурагчдад нэмэлт даалгавар", followup_done: "Нэмэлт даалгавар үүслээ:", followup_for: "сурагчид",
  rec_title: "Давтагддаг даалгавар", rec_lead: "Сонгосон гарагт автоматаар шинэ даалгавар үүснэ.", rec_weekday: "Гараг", rec_hour: "Цаг", rec_open: "Нээлттэй байх (хоног)", rec_add: "Давтамж нэмэх",
  rec_none: "Давтагддаг даалгавар алга.", rec_every: "Гараг бүр", weekdays: "Ням,Даваа,Мягмар,Лхагва,Пүрэв,Баасан,Бямба",
  live_start: "Шууд асуулт эхлүүлэх", live_lead: "Асуултыг том дэлгэцэнд гаргаж, сурагчид утсаараа хариулна.", live_answered: "хариулсан",
  live_reveal: "Хариу нээх", live_next: "Дараагийн асуулт", live_end: "Дуусгах", live_board: "Тэргүүлэгчид",
  st_detail: "Сурагчийн дэлгэрэнгүй", reset_pin: "PIN шинэчлэх", new_pin: "Шинэ PIN", pin_saved: "PIN шинэчлэгдлээ. Сурагч шинэ PIN-ээр нэвтэрнэ.",
  vocab_quiz: "Үгийн тест", vocab_cards: "Карт", vq_q: "Энэ үгийн утга аль нь вэ?", vq_score: "Оноо", vq_again: "Дахин тест"
});
Object.assign(I18N.en, {
  diff: "Difficulty", diff_all: "All levels", diff_1: "Easy", diff_2: "Medium", diff_3: "Hard",
  mode: "Type", mode_standard: "Standard test", mode_adaptive: "Real SAT format (2 modules, adaptive)",
  adaptive_hint: "Module 2 becomes harder or easier based on Module 1. Questions are split evenly between the two modules.",
  module: "Module", module_next: "Finish Module 1 and go to Module 2", module2_hard: "Module 2: harder", module2_easy: "Module 2: easier",
  path_hard: "Harder path", path_easy: "Easier path",
  goal_title: "My goal", goal_target: "Target total score", goal_date: "Test date", goal_save: "Save",
  goal_none: "Enter a target score and test date to get a daily plan.",
  days_left: "days left", est_now: "Current estimate", gap: "To go", daily_goal: "Today's goal", q_today: "questions",
  daily_start: "Start daily practice", daily_title: "Daily practice", daily_lead: "Questions picked from your weakest topics.", daily_done: "Daily practice complete!",
  streak: "Day streak", best: "Best", badges: "Badges", no_badges: "Complete assignments and practice to earn badges.",
  progress: "My progress", no_history: "Your scores will appear here as a chart once you submit assignments.",
  board_title: "This week's activity", board_lead: "Questions answered. Participation, not scores.", you: "You",
  b_first: "First step", b_streak3: "3-day streak", b_streak7: "7-day streak", b_perfect: "Perfect score", b_hundred: "100 questions", b_cleaner: "Notebook cleaner", b_master: "master",
  live_banner: "Your teacher started a live quiz!", live_join: "Join", live_title: "Live quiz", live_wait: "Waiting for your teacher to open the next question…",
  live_sent: "Answer sent. Wait for your teacher to reveal it.", live_ended: "The live quiz has ended.",
  offline: "You're offline. Your answers are saved and will be sent automatically when you reconnect.", pending_sent: "Your saved answers were submitted.",
  targeted: "For you",
  t_forgot: "Forgot password", recovery_code: "Recovery code", new_password: "New password", reset_btn: "Reset password",
  recovery_show: "Save this recovery code. If you forget your password, it is the only way to reset it:", recovery_ok: "I saved it",
  account: "Account", change_pw: "Change password", current_pw: "Current password", new_recovery: "Get a new recovery code", saved: "Saved.",
  co_teachers: "Co-teachers", co_add: "Add", co_email: "Teacher's email", owner: "owner",
  followup: "Follow-up for struggling students", followup_done: "Follow-up assignment created:", followup_for: "students",
  rec_title: "Recurring assignments", rec_lead: "A new assignment is created automatically on the chosen day.", rec_weekday: "Day", rec_hour: "Hour", rec_open: "Open for (days)", rec_add: "Add schedule",
  rec_none: "No recurring assignments.", rec_every: "Every", weekdays: "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday",
  live_start: "Start live quiz", live_lead: "Show a question on the big screen; students answer on their phones.", live_answered: "answered",
  live_reveal: "Reveal answer", live_next: "Next question", live_end: "End", live_board: "Leaderboard",
  st_detail: "Student details", reset_pin: "Reset PIN", new_pin: "New PIN", pin_saved: "PIN updated. The student signs in with the new PIN.",
  vocab_quiz: "Word quiz", vocab_cards: "Cards", vq_q: "What does this word mean?", vq_score: "Score", vq_again: "New quiz"
});

const diffLabel = d => t("diff_" + (d || 2));
const diffDots = d => "●".repeat(d || 2) + "○".repeat(3 - (d || 2));
function badgeLabel(b) {
  if (b.id === "master") return `${domName(b.subject, b.domain)} ${t("b_master")}`;
  return t("b_" + b.id);
}
const BADGE_ICON = { first: "1", streak3: "3", streak7: "7", perfect: "★", hundred: "100", cleaner: "✓", master: "M" };
function badgesHTML(list) {
  if (!list.length) return `<p class="small">${t("no_badges")}</p>`;
  return `<div class="badges">${list.map(b => `<span class="badge"><span class="bdot">${esc(BADGE_ICON[b.id] || "•")}</span>${esc(badgeLabel(b))}</span>`).join("")}</div>`;
}
function selectOptions(el, opts, value) {
  el.innerHTML = opts.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(value) ? "selected" : ""}>${esc(l)}</option>`).join("");
}
function diffOptions(el, value) { selectOptions(el, [["all", t("diff_all")], ["1", t("diff_1")], ["2", t("diff_2")], ["3", t("diff_3")]], value || "all"); }

// Онооны график (SVG, сэдэв тус бүр шугам)
function lineChart(history) {
  if (!history.length) return `<div class="empty">${t("no_history")}</div>`;
  const W = 640, H = 220, L0 = 44, R0 = 12, T0 = 14, B0 = 28;
  const n = history.length;
  const x = i => n === 1 ? (L0 + (W - R0)) / 2 : L0 + i * ((W - L0 - R0) / (n - 1));
  const y = v => T0 + (800 - v) / 600 * (H - T0 - B0);
  const grid = [200, 400, 600, 800].map(v => `<line x1="${L0}" x2="${W - R0}" y1="${y(v)}" y2="${y(v)}" class="cgrid"/><text x="${L0 - 8}" y="${y(v) + 4}" class="clab" text-anchor="end">${v}</text>`).join("");
  const series = Object.keys(META.subjects).map((s, si) => {
    const pts = history.map((h, i) => ({ i, h })).filter(p => p.h.subject === s);
    if (!pts.length) return "";
    const cls = si === 0 ? "s1" : "s2";
    const d = pts.map((p, k) => `${k ? "L" : "M"}${x(p.i).toFixed(1)},${y(p.h.score).toFixed(1)}`).join(" ");
    const dots = pts.map((p, k) => `<circle cx="${x(p.i).toFixed(1)}" cy="${y(p.h.score).toFixed(1)}" r="${k === pts.length - 1 ? 5 : 3.5}" class="cdot ${cls}"><title>${esc(p.h.title)}: ${p.h.score}</title></circle>`).join("");
    return `<path d="${d}" class="cline ${cls}"/>${dots}`;
  }).join("");
  const legend = Object.keys(META.subjects).map((s, si) => `<span class="lg"><i class="${si === 0 ? "s1" : "s2"}"></i>${esc(subjName(s))}</span>`).join("");
  return `<div class="chartwrap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("progress"))}">${grid}${series}</svg></div><div class="legend">${legend}</div>`;
}

// Сүлжээгүй үед хадгалсан илгээлтүүд
const pending = {
  all() { return store.get("o16pending", []); },
  add(item) { const p = pending.all().filter(x => x.id !== item.id); p.push(item); store.set("o16pending", p); },
  remove(id) { store.set("o16pending", pending.all().filter(x => x.id !== id)); }
};
if ("serviceWorker" in navigator) { window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {})); }
