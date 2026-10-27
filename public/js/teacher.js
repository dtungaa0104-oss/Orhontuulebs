// Багшийн хуудас: нэвтрэх/сэргээх, анги, даалгавар, шинжилгээ, шууд асуулт, давтамж, асуултын сан.
let token = store.get("o16tt", null);
let mode = "login", meData = null, classId = store.get("o16class", null), classData = null, resData = null, resId = null, poll = null;
function show(v) { ["vAuth", "vDash", "vRes"].forEach(id => $(id).hidden = id !== v); }
const dt = ms => new Date(ms).toLocaleString(LANG === "mn" ? "mn-MN" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
const weekdayName = i => t("weekdays").split(",")[i];
function armed(b, fn) { return async () => { if (b.dataset.armed !== "1") { b.dataset.armed = "1"; b.textContent = t("confirm_delete"); return; } await fn(); }; }

// ---------- цонх ----------
function openModal(html) { $("modalBody").innerHTML = html; $("modal").hidden = false; document.body.style.overflow = "hidden"; }
function closeModal() { $("modal").hidden = true; document.body.style.overflow = ""; }
$("modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); });
function showRecovery(code) {
  openModal(`<h3 style="font-size:18px">${t("recovery_code")}</h3><p class="small">${t("recovery_show")}</p>
    <div class="codebox" style="user-select:all">${esc(code)}</div>
    <div class="btns"><button class="btn ghost sm" type="button" id="recCopy">Copy</button><button class="btn" type="button" id="recOk">${t("recovery_ok")}</button></div>`);
  $("recCopy").onclick = () => { try { navigator.clipboard.writeText(code).catch(() => {}); } catch (e) {} };
  $("recOk").onclick = closeModal;
}

// ---------- нэвтрэх ----------
function setMode(m) {
  mode = m;
  $("tabLogin").setAttribute("aria-pressed", m === "login");
  $("tabReg").setAttribute("aria-pressed", m === "reg");
  $("tabReset").setAttribute("aria-pressed", m === "reset");
  $("fName").hidden = m !== "reg";
  $("fRec").hidden = m !== "reset";
  $("fInvite").hidden = !(m === "reg" && META && META.inviteRequired);
  $("passLab").textContent = m === "reset" ? t("new_password") : t("password");
  $("authBtn").textContent = t(m === "login" ? "t_login" : m === "reg" ? "t_register" : "reset_btn");
  $("aPass").autocomplete = m === "login" ? "current-password" : "new-password";
}
$("tabLogin").onclick = () => setMode("login");
$("tabReg").onclick = () => setMode("reg");
$("tabReset").onclick = () => setMode("reset");
$("authForm").addEventListener("submit", async e => {
  e.preventDefault();
  const st = $("authStatus"); st.className = "status"; st.textContent = "…";
  try {
    let r;
    if (mode === "login") r = await api("/api/teacher/login", { method: "POST", body: { email: $("aEmail").value, password: $("aPass").value } });
    else if (mode === "reg") r = await api("/api/teacher/register", { method: "POST", body: { name: $("aName").value, email: $("aEmail").value, password: $("aPass").value, invite: $("aInvite").value } });
    else r = await api("/api/teacher/reset", { method: "POST", body: { email: $("aEmail").value, recoveryCode: $("aRec").value, newPassword: $("aPass").value } });
    token = r.token; store.set("o16tt", token); st.textContent = "";
    await loadDash();
    if (r.recoveryCode) showRecovery(r.recoveryCode);
  } catch (err) { st.className = "status bad"; st.textContent = err.message; }
});
$("logout").onclick = () => { store.del("o16tt"); token = null; show("vAuth"); };
$("accountOpen").onclick = () => {
  openModal(`<div class="btns" style="justify-content:space-between"><h3 style="font-size:18px">${t("account")}</h3><button class="btn ghost sm" type="button" id="mClose">${t("close")}</button></div>
    <p class="small">${esc(meData.teacher.name)} · ${esc(meData.teacher.email)}</p>
    <form id="pwForm" class="form"><label class="field"><span>${t("current_pw")}</span><input id="pwCur" type="password" autocomplete="current-password" required></label>
      <label class="field"><span>${t("new_password")}</span><input id="pwNew" type="password" autocomplete="new-password" minlength="6" required></label>
      <button class="btn ghost" type="submit">${t("change_pw")}</button></form>
    <p class="status" id="pwStatus"></p>
    <div><button class="btn ghost sm" type="button" id="newRec">${t("new_recovery")}</button></div>`);
  $("mClose").onclick = closeModal;
  $("pwForm").addEventListener("submit", async e => {
    e.preventDefault();
    try { await api("/api/teacher/password", { method: "POST", body: { current: $("pwCur").value, next: $("pwNew").value } }, token); $("pwStatus").className = "status ok"; $("pwStatus").textContent = t("saved"); }
    catch (err) { $("pwStatus").className = "status bad"; $("pwStatus").textContent = err.message; }
  });
  $("newRec").onclick = async () => { const r = await api("/api/teacher/recovery", { method: "POST" }, token); showRecovery(r.recoveryCode); };
};

// ---------- самбар ----------
async function loadDash() {
  if (!token) return show("vAuth");
  try { meData = await api("/api/teacher/me", {}, token); }
  catch (e) { if (e.status === 401) { store.del("o16tt"); token = null; return show("vAuth"); } throw e; }
  $("tName").textContent = meData.teacher.name;
  if (!meData.classes.find(c => c.id === classId)) classId = meData.classes[0]?.id || null;
  drawTabs(); show("vDash"); loadQB();
  if (classId) await loadClass(); else $("classView").hidden = true;
}
function drawTabs() {
  $("classTabs").innerHTML = meData.classes.length
    ? meData.classes.map(c => `<button type="button" class="chip" aria-pressed="${c.id === classId}" data-id="${esc(c.id)}">${esc(c.name)} · ${c.studentCount}${c.isOwner ? "" : " ⇄"}</button>`).join("")
    : `<p class="small">${t("no_classes")}</p>`;
  $("classTabs").querySelectorAll("button").forEach(b => b.onclick = () => { classId = b.dataset.id; store.set("o16class", classId); drawTabs(); loadClass(); });
}
$("classForm").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    const c = await api("/api/teacher/classes", { method: "POST", body: { name: $("cName").value } }, token);
    $("cName").value = ""; classId = c.id; store.set("o16class", classId); loadDash();
  } catch (err) { $("cName").setCustomValidity(err.message); $("cName").reportValidity(); setTimeout(() => $("cName").setCustomValidity(""), 3000); }
});
async function loadClass() {
  classData = await api(`/api/teacher/classes/${classId}`, {}, token);
  $("classView").hidden = false;
  $("cCode").textContent = classData.class.code;
  $("cLink").textContent = location.origin + "/student";
  drawStudents(); drawCo(); drawAssigns(); drawRecurring(); loadAnalysis();
}
function drawStudents() {
  const s = classData.students;
  $("sList").innerHTML = s.length ? s.map(x => `<div class="arow"><button type="button" class="btn ghost sm" data-st="${esc(x.id)}">${esc(x.name)}</button>
     <button class="btn danger sm" type="button" data-rm="${esc(x.id)}">${t("remove")}</button></div>`).join("") : `<div class="empty">${t("t_no_students")}</div>`;
  $("sList").querySelectorAll("[data-rm]").forEach(b => b.onclick = armed(b, async () => { await api(`/api/teacher/students/${b.dataset.rm}`, { method: "DELETE" }, token); loadClass(); loadDashSilently(); }));
  $("sList").querySelectorAll("[data-st]").forEach(b => b.onclick = () => openStudent(b.dataset.st));
}
function drawCo() {
  const owner = classData.class.isOwner;
  $("coList").innerHTML = classData.teachers.map(x => `<div class="arow"><span>${esc(x.name)} <span class="small">${esc(x.email)}${x.isOwner ? ` · ${t("owner")}` : ""}</span></span>
     ${owner && !x.isOwner ? `<button class="btn danger sm" type="button" data-co="${esc(x.id)}">${t("remove")}</button>` : ""}</div>`).join("");
  $("coList").querySelectorAll("[data-co]").forEach(b => b.onclick = armed(b, async () => { await api(`/api/teacher/classes/${classId}/teachers/${b.dataset.co}`, { method: "DELETE" }, token); loadClass(); }));
  $("coForm").hidden = !owner;
}
$("coForm").addEventListener("submit", async e => {
  e.preventDefault();
  try { await api(`/api/teacher/classes/${classId}/teachers`, { method: "POST", body: { email: $("coEmail").value } }, token); $("coEmail").value = ""; $("coStatus").textContent = ""; loadClass(); }
  catch (err) { $("coStatus").className = "status bad"; $("coStatus").textContent = err.message; }
});
async function loadDashSilently() { try { meData = await api("/api/teacher/me", {}, token); drawTabs(); } catch (e) {} }

function drawAssigns() {
  const a = classData.assignments;
  $("asList").innerHTML = a.length ? a.map(x => {
    const tags = [x.mode === "adaptive" ? `<span class="pill mid">SAT · 2 ${t("module")}</span>` : "", x.targeted ? `<span class="pill ok">${t("followup_for")}: ${x.targetCount}</span>` : "",
      x.difficulty ? `<span class="pill mute">${esc(diffLabel(+x.difficulty))}</span>` : "",
      x.qlang === "en" ? `<span class="pill mute">${esc(t("ql_en"))}</span>` : x.qlang === "both" ? `<span class="pill mute">${esc(t("ql_both"))}</span>` : ""].join(" ");
    return `<div class="arow"><div style="min-width:0"><b>${esc(x.title)}</b>
     <span class="small">${esc(subjName(x.subject))} · ${esc(domName(x.subject, x.domain))} · ${x.questionCount} ${t("questions")} · ${x.time_limit_min} ${t("minutes")}${x.due_at ? ` · ${t("due")}: ${esc(dt(x.due_at))}` : ""}</span>
     <div class="btns" style="margin-top:4px">${tags}</div></div>
     <div class="btns"><span class="pill ${x.targetCount && x.submitted === x.targetCount ? "ok" : "mid"}">${x.submitted}/${x.targetCount} ${t("submitted_n")}</span>
     <button class="btn sm" type="button" data-res="${esc(x.id)}">${t("results")}</button>
     <button class="btn danger sm" type="button" data-del="${esc(x.id)}">${t("delete")}</button></div></div>`;
  }).join("") : `<div class="empty">${t("no_assignments")}</div>`;
  $("asList").querySelectorAll("[data-res]").forEach(b => b.onclick = () => openResults(b.dataset.res));
  $("asList").querySelectorAll("[data-del]").forEach(b => b.onclick = armed(b, async () => { await api(`/api/teacher/assignments/${b.dataset.del}`, { method: "DELETE" }, token); loadClass(); }));
}

// ---------- маягтууд ----------
function subjSelect(el, value) { selectOptions(el, Object.keys(META.subjects).map(k => [k, subjName(k)]), value || el.value || "M"); }
function domSelect(el, subject, value, withAll = true) {
  const doms = Object.keys(META.subjects[subject].domains);
  selectOptions(el, [...(withAll ? [["all", t("all_topics")]] : []), ...doms.map(d => [d, domName(subject, d)])], value || el.value || (withAll ? "all" : doms[0]));
}
function fillForms() {
  subjSelect($("asSubj")); domSelect($("asDom"), $("asSubj").value); diffOptions($("asDiff"), $("asDiff").value);
  subjSelect($("lvSubj")); domSelect($("lvDom"), $("lvSubj").value); diffOptions($("lvDiff"), $("lvDiff").value);
  subjSelect($("recSubj")); domSelect($("recDom"), $("recSubj").value);
  selectOptions($("recDay"), [1, 2, 3, 4, 5, 6, 0].map(i => [i, weekdayName(i)]), $("recDay").value || 1);
  subjSelect($("qbSubj")); domSelect($("qbDom"), $("qbSubj").value, null, false);
  $("asQlWrap").hidden = $("asSubj").value !== "M";
  $("asModeHint").hidden = $("asMode").value !== "adaptive";
  $("asDiffWrap").hidden = $("asMode").value === "adaptive";
}
$("asSubj").onchange = () => { domSelect($("asDom"), $("asSubj").value, "all"); suggestTime(); $("asQlWrap").hidden = $("asSubj").value !== "M"; };
$("lvSubj").onchange = () => domSelect($("lvDom"), $("lvSubj").value, "all");
$("recSubj").onchange = () => domSelect($("recDom"), $("recSubj").value, "all");
$("qbSubj").onchange = () => domSelect($("qbDom"), $("qbSubj").value, Object.keys(META.subjects[$("qbSubj").value].domains)[0], false);
$("asMode").onchange = () => {
  const ad = $("asMode").value === "adaptive";
  $("asModeHint").hidden = !ad; $("asDiffWrap").hidden = ad;
  if (ad && Number($("asCount").value) < 8) $("asCount").value = 12;
  suggestTime();
};
function suggestTime() {
  const n = Number($("asCount").value) || 1;
  $("asTime").value = Math.max(1, Math.round(n * META.subjects[$("asSubj").value].secondsPerQuestion / 60));
}
$("asCount").oninput = suggestTime;
$("asForm").addEventListener("submit", async e => {
  e.preventDefault();
  const st = $("asStatus");
  const due = $("asDue").value ? new Date($("asDue").value).getTime() : null;
  try {
    await api("/api/teacher/assignments", { method: "POST", body: {
      classId, title: $("asTitle").value, subject: $("asSubj").value, domain: $("asDom").value, mode: $("asMode").value,
      difficulty: $("asDiff").value, source: $("asSrc").value, qlang: $("asQl").value, count: Number($("asCount").value), timeLimitMin: Number($("asTime").value), dueAt: due } }, token);
    $("asTitle").value = ""; st.className = "status ok"; st.textContent = "✓";
    loadClass();
  } catch (err) { st.className = "status bad"; st.textContent = err.message; }
});

// ---------- давтагддаг даалгавар ----------
function drawRecurring() {
  const r = classData.recurring;
  $("recList").innerHTML = r.length ? r.map(x => `<div class="arow"><div style="min-width:0"><b>${esc(x.title)}</b>
      <span class="small">${t("rec_every")} ${esc(weekdayName(x.run_weekday))} ${String(x.run_hour).padStart(2, "0")}:00 · ${esc(subjName(x.subject))} · ${esc(domName(x.subject, x.domain))} · ${x.q_count} ${t("questions")} · ${x.days_open}d</span></div>
      <button class="btn danger sm" type="button" data-rec="${esc(x.id)}">${t("delete")}</button></div>`).join("") : `<div class="empty">${t("rec_none")}</div>`;
  $("recList").querySelectorAll("[data-rec]").forEach(b => b.onclick = armed(b, async () => { await api(`/api/teacher/recurring/${b.dataset.rec}`, { method: "DELETE" }, token); loadClass(); }));
}
$("recForm").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    await api("/api/teacher/recurring", { method: "POST", body: { classId, title: $("recTitle").value, subject: $("recSubj").value, domain: $("recDom").value,
      weekday: Number($("recDay").value), hour: Number($("recHour").value), count: Number($("recCount").value), timeLimitMin: Number($("recTime").value), daysOpen: Number($("recOpen").value) } }, token);
    $("recTitle").value = ""; $("recStatus").className = "status ok"; $("recStatus").textContent = t("saved"); loadClass();
  } catch (err) { $("recStatus").className = "status bad"; $("recStatus").textContent = err.message; }
});

// ---------- шинжилгээ ----------
let anData = null;
async function loadAnalysis() { try { anData = await api(`/api/teacher/classes/${classId}/analysis`, {}, token); drawAnalysis(); } catch (e) {} }
function drawAnalysis() {
  if (!anData) return;
  $("anMeta").textContent = anData.attempts ? `${anData.attempts} ${t("an_attempts")}` : "";
  $("anPart").innerHTML = anData.participation.map((p, i) => `<div class="boardrow"><span class="mono">${i + 1}</span><span>${esc(p.name)} <span class="small">· ${t("streak")}: ${p.streak}</span></span><span class="mono">${p.week}</span></div>`).join("");
  if (!anData.domains.length) { $("anBody").innerHTML = `<div class="empty">${t("an_empty")}</div>`; return; }
  const rows = anData.domains.map((d, i) => {
    const pct = Math.round(d.pct * 100), cls = d.pct >= .8 ? "good" : d.pct >= .6 ? "mid" : "weak";
    return `<div class="arow" style="align-items:flex-start"><div style="flex:1;min-width:min(100%,260px);display:grid;gap:6px">
        <div class="btns" style="justify-content:space-between"><b>${esc(subjName(d.subject))} · ${esc(domName(d.subject, d.domain))}</b><span class="mono">${pct}% · ${d.correct}/${d.total}</span></div>
        <div class="bar"><i class="${cls}" style="width:${Math.max(4, pct)}%"></i></div>
        ${d.struggling.length ? `<span class="small"><span class="pill bad">${t("an_struggling")}: ${d.struggling.length}/${d.studentCount}</span> ${esc(d.struggling.join(", "))}</span>` : ""}
      </div>${d.pct < .8 ? `<button class="btn ghost sm" type="button" data-an="${i}">${t("an_assign")}</button>` : ""}</div>`;
  }).join("");
  const hard = anData.hardest.length ? `<h4 style="margin:18px 0 8px;font-size:15px">${t("an_hardest")}</h4><div class="tablewrap"><table><tbody>${
    anData.hardest.map(x => `<tr><td>${esc(domName(x.question.subject, x.question.domain))}</td><td>${esc(qf(x.question, "q").split("\n")[0])}</td>
      <td class="num">${L[x.question.answer]}</td><td><span class="pill ${pillClass(x.pct)}">${Math.round(x.pct * 100)}%</span></td></tr>`).join("")}</tbody></table></div>` : "";
  $("anBody").innerHTML = `<div class="list">${rows}</div>${hard}`;
  $("anBody").querySelectorAll("[data-an]").forEach(b => b.onclick = () => {
    const d = anData.domains[+b.dataset.an];
    $("asMode").value = "standard"; $("asMode").onchange();
    subjSelect($("asSubj"), d.subject); domSelect($("asDom"), d.subject, d.domain);
    $("asTitle").value = `${domName(d.subject, d.domain)} — ${t("an_review")}`;
    $("asStatus").className = "status ok"; $("asStatus").textContent = t("an_prefill");
    $("asForm").scrollIntoView({ behavior: "smooth", block: "center" }); $("asTitle").focus({ preventScroll: true });
  });
}

// ---------- сурагчийн дэлгэрэнгүй ----------
async function openStudent(id) {
  let d;
  try { d = await api(`/api/teacher/students/${id}`, {}, token); } catch (e) { return; }
  const doms = Object.entries(d.domains).map(([k, [c, n]]) => { const [s, dm] = k.split(":"); return { s, dm, c, n }; }).sort((a, b) => a.c / a.n - b.c / b.n);
  openModal(`<div class="btns" style="justify-content:space-between"><h3 style="font-size:20px">${esc(d.student.name)}</h3><button class="btn ghost sm" type="button" id="mClose">${t("close")}</button></div>
    <div class="stats">
      <div class="stat"><span class="eyebrow">${t("streak")}</span><b>${d.streak.current}</b><span class="small">${t("best")}: ${d.streak.best}</span></div>
      <div class="stat"><span class="eyebrow">${t("board_title")}</span><b>${d.weekQ}</b><span class="small">${t("q_today")}</span></div>
      <div class="stat"><span class="eyebrow">${t("mist_title")}</span><b>${d.mistakes}</b></div>
      ${d.plan ? `<div class="stat"><span class="eyebrow">${t("goal_target")}</span><b>${d.plan.target}</b><span class="small">${t("est_now")}: ${d.plan.current}</span></div>` : ""}
    </div>
    <h4 style="font-size:15px">${t("progress")}</h4>${lineChart(d.history)}
    <h4 style="font-size:15px">${t("by_topic")}</h4>
    <div class="stack" style="gap:8px">${doms.length ? doms.map(x => `<div class="trow"><span>${esc(subjName(x.s))} · ${esc(domName(x.s, x.dm))}</span><div class="bar"><i class="${x.c / x.n >= .8 ? "good" : x.c / x.n >= .5 ? "mid" : "weak"}" style="width:${Math.max(6, x.c / x.n * 100)}%"></i></div><span>${x.c}/${x.n}</span></div>`).join("") : `<p class="small">—</p>`}</div>
    <h4 style="font-size:15px">${t("badges")}</h4>${badgesHTML(d.badges)}
    <form id="pinForm" class="form"><label class="field"><span>${t("new_pin")}</span><input id="pinNew" inputmode="numeric" pattern="\\d{4}" maxlength="4" required></label><button class="btn ghost sm" type="submit">${t("reset_pin")}</button></form>
    <p class="status" id="pinStatus"></p>`);
  $("mClose").onclick = closeModal;
  $("pinForm").addEventListener("submit", async e => {
    e.preventDefault();
    try { await api(`/api/teacher/students/${id}/pin`, { method: "POST", body: { pin: $("pinNew").value } }, token); $("pinStatus").className = "status ok"; $("pinStatus").textContent = t("pin_saved"); }
    catch (err) { $("pinStatus").className = "status bad"; $("pinStatus").textContent = err.message; }
  });
}

// ---------- дүн ----------
const statusPill = s => ({ submitted: "ok", late: "bad", expired: "bad", in_progress: "mid", not_started: "mute" }[s]);
async function openResults(id) {
  resId = id; $("rFollowStatus").textContent = ""; await loadResults(); show("vRes"); window.scrollTo(0, 0);
  clearInterval(poll); poll = setInterval(loadResults, 15000);
}
async function loadResults() { try { resData = await api(`/api/teacher/assignments/${resId}/results`, {}, token); drawResults(); } catch (e) {} }
function drawResults() {
  const a = resData.assignment, s = a.subject;
  $("rTitle").textContent = a.title;
  $("rMeta").textContent = `${resData.class.name} · ${subjName(s)} · ${domName(s, a.domain)} · ${a.questionCount} ${t("questions")} · ${a.time_limit_min} ${t("minutes")}${a.mode === "adaptive" ? " · SAT 2 " + t("module") : ""}${a.due_at ? ` · ${t("due")}: ${dt(a.due_at)}` : ""}`;
  const done = resData.rows.filter(r => r.correct !== null);
  const avg = done.length ? done.reduce((x, r) => x + r.correct / r.total, 0) / done.length : 0;
  $("rSummary").innerHTML = `<b>${t("t_submitted")}: ${done.length}/${resData.rows.length}</b><span>${t("t_avg")}: <b class="mono">${Math.round(avg * 100)}%</b></span>`;
  const ad = a.mode === "adaptive";
  $("rTable").innerHTML = resData.rows.length ? `<div class="tablewrap"><table><thead><tr>
    <th>${t("col_student")}</th><th>${t("col_status")}</th><th>${t("col_correct")}</th><th>${t("col_score")}</th>${ad ? `<th>${t("module")} 2</th>` : ""}<th>${t("col_time")}</th><th>${t("col_weak")}</th><th>${t("col_sent")}</th></tr></thead><tbody>${
    resData.rows.map(r => `<tr><td><button class="btn ghost sm" type="button" data-st="${esc(r.studentId)}">${esc(r.name)}</button></td><td><span class="pill ${statusPill(r.status)}">${t("st_" + r.status)}</span></td>
        <td>${r.correct !== null ? `<span class="pill ${pillClass(r.correct / r.total)}">${r.correct}/${r.total}</span>` : "—"}</td>
        <td class="num">${r.score ?? "—"}</td>${ad ? `<td>${r.path ? esc(t(r.path === "hard" ? "path_hard" : "path_easy")) : "—"}</td>` : ""}
        <td class="num">${r.seconds !== null ? fmt(r.seconds) : "—"}</td>
        <td>${esc(r.byDomain ? weakTopics(s, r.byDomain).join(", ") || "—" : "—")}</td><td class="num">${r.submittedAt ? esc(dt(r.submittedAt)) : "—"}</td></tr>`).join("")}</tbody></table></div>`
    : `<div class="empty">${t("t_no_students")}</div>`;
  $("rTable").querySelectorAll("[data-st]").forEach(b => b.onclick = () => openStudent(b.dataset.st));
  $("rQs").innerHTML = `<div class="tablewrap"><table><thead><tr><th>#</th><th>${t("lab_topic")}</th><th>${t("diff")}</th><th>${t("q_of")}</th><th>${t("answer")}</th><th>%</th></tr></thead><tbody>${
    resData.questions.map(q => {
      const base = ad ? q.stats.seen : done.length;
      const pct = base ? Math.round(q.stats.correct / base * 100) : null;
      return `<tr><td class="num">${q.n}</td><td>${esc(domName(q.subject, q.domain))}</td><td>${esc(diffLabel(q.difficulty))}</td><td>${esc(qf(q, "q").split("\n")[0])}</td><td class="num">${L[q.answer]}</td>
        <td>${pct !== null ? `<span class="pill ${pillClass(pct / 100)}">${pct}%</span>` : "—"}</td></tr>`;
    }).join("")}</tbody></table></div>`;
}
$("rBack").onclick = () => { clearInterval(poll); show("vDash"); loadClass(); };
$("rFollow").onclick = async () => {
  const st = $("rFollowStatus");
  try {
    const r = await api(`/api/teacher/assignments/${resId}/followup`, { method: "POST", body: {} }, token);
    st.className = "status ok"; st.textContent = `${t("followup_done")} ${domName(resData.assignment.subject, r.domain)} → ${r.students.join(", ")}`;
  } catch (err) { st.className = "status bad"; st.textContent = err.message; }
};
$("rCsv").onclick = async () => {
  const res = await fetch(`/api/teacher/assignments/${resId}/results.csv`, { headers: { Authorization: "Bearer " + token } });
  if (!res.ok) return;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url; a.download = `${resData.assignment.title.replace(/[^\p{L}\p{N}]+/gu, "_")}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
};

// ---------- том дэлгэц (даалгаврын асуултууд) ----------
let pi = 0, pRev = false, pSel = null, projMode = null;
$("rProj").onclick = () => { projMode = "review"; pi = 0; pRev = false; pSel = null; openProj(); drawProj(); };
function openProj() { $("proj").hidden = false; document.body.style.overflow = "hidden"; }
function closeProj() { $("proj").hidden = true; document.body.style.overflow = ""; clearTimeout(liveTimer); projMode = null; }
function drawProj() {
  const qs = resData.questions, q = qs[pi];
  $("projBody").innerHTML = `<div class="btns" style="justify-content:space-between"><span class="eyebrow">${esc(resData.assignment.title)}</span><span class="btns">${q.subject === "M" ? `<span id="pQl">${qlangSwitch(false)}</span>` : ""}<button class="btn ghost sm" type="button" id="pClose">${t("close")}</button></span></div>
    <div>${questionHTML(q, pi, qs.length, { sel: pSel, revealed: pRev })}</div>
    <div class="qnav"><button class="btn ghost" type="button" id="pPrev" ${pi === 0 ? "disabled" : ""}>${t("prev")}</button>
    <div class="btns">${pRev ? "" : `<button class="btn ghost" type="button" id="pRev">${t("reveal")}</button>`}
    <button class="btn" type="button" id="pNext" ${pi === qs.length - 1 ? "disabled" : ""}>${t("next")}</button></div></div>`;
  $("projBody").querySelectorAll(".opt").forEach(b => b.onclick = () => { pSel = +b.dataset.k; drawProj(); });
  if ($("pQl")) bindQlang($("pQl"), drawProj);
  $("pClose").onclick = closeProj;
  $("pPrev").onclick = () => { pi--; pRev = false; pSel = null; drawProj(); };
  $("pNext").onclick = () => { pi++; pRev = false; pSel = null; drawProj(); };
  if ($("pRev")) $("pRev").onclick = () => { pRev = true; drawProj(); };
}
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !$("modal").hidden) return closeModal();
  if ($("proj").hidden || projMode !== "review") return;
  const n = resData.questions.length;
  if (e.key === "Escape") closeProj();
  if (e.key === "ArrowRight" && pi < n - 1) { pi++; pRev = false; pSel = null; drawProj(); }
  if (e.key === "ArrowLeft" && pi > 0) { pi--; pRev = false; pSel = null; drawProj(); }
});

// ---------- шууд асуулт ----------
let liveId = null, liveTimer = null;
$("lvForm").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    const r = await api("/api/teacher/live", { method: "POST", body: { classId, subject: $("lvSubj").value, domain: $("lvDom").value, difficulty: $("lvDiff").value, count: Number($("lvCount").value) } }, token);
    liveId = r.id; projMode = "live"; $("lvStatus").textContent = ""; openProj(); pollLiveT();
  } catch (err) { $("lvStatus").className = "status bad"; $("lvStatus").textContent = err.message; }
});
async function pollLiveT() {
  clearTimeout(liveTimer);
  if (projMode !== "live") return;
  try { drawLiveT(await api(`/api/teacher/live/${liveId}`, {}, token)); } catch (e) {}
  liveTimer = setTimeout(pollLiveT, 2000);
}
async function liveAction(action) { await api(`/api/teacher/live/${liveId}/action`, { method: "POST", body: { action } }, token); pollLiveT(); }
function drawLiveT(s) {
  const head = `<div class="btns" style="justify-content:space-between"><span class="eyebrow">${t("live_title")} · ${esc(s.title)} · ${s.idx + 1} / ${s.total}</span><span class="btns">${s.question && s.question.subject === "M" ? `<span id="pQl">${qlangSwitch(false)}</span>` : ""}<button class="btn ghost sm" type="button" id="pClose">${t("close")}</button></span></div>`;
  const board = `<div class="panel"><h3 style="font-size:18px;margin-bottom:8px">${t("live_board")}</h3>${s.board.slice(0, 10).map((b, i) => `<div class="boardrow"><span class="mono">${i + 1}</span><span>${esc(b.name)}</span><span class="mono">${b.correct}</span></div>`).join("")}</div>`;
  if (s.state === "ended") {
    $("projBody").innerHTML = head + `<p class="status ok">${t("live_ended")}</p>` + board;
  } else {
    const max = Math.max(1, ...s.counts);
    const bars = s.counts.map((c, k) => `<div class="livebar ${s.state === "reveal" && k === s.question.answer ? "right" : ""}"><b>${c}</b><div class="col" style="height:${c / max * 100}%"></div><span class="bub" style="margin:0 auto">${L[k]}</span></div>`).join("");
    $("projBody").innerHTML = head + `<div>${questionHTML(s.question, s.idx, s.total, { sel: null, revealed: s.state === "reveal" })}</div>
      <div class="panel"><div class="btns" style="justify-content:space-between;margin-bottom:10px"><b>${s.answered} / ${s.studentCount} ${t("live_answered")}</b>
        <div class="btns">${s.state === "question" ? `<button class="btn" type="button" id="lvRev">${t("live_reveal")}</button>` : `<button class="btn" type="button" id="lvNext">${s.idx < s.total - 1 ? t("live_next") : t("live_end")}</button>`}
        <button class="btn ghost" type="button" id="lvEnd">${t("live_end")}</button></div></div>
        <div class="livebars">${bars}</div></div>` + board;
    if ($("lvRev")) $("lvRev").onclick = () => liveAction("reveal");
    if ($("lvNext")) $("lvNext").onclick = () => liveAction("next");
    $("lvEnd").onclick = () => liveAction("end");
  }
  if ($("pQl")) bindQlang($("pQl"), () => drawLiveT(s));
  $("pClose").onclick = closeProj;
}

// ---------- асуултын сан ----------
let qbData = null;
async function loadQB() { try { qbData = await api("/api/teacher/questions", {}, token); drawQB(); } catch (e) {} }
function drawQB() {
  if (!qbData) return;
  const mine = qbData.questions;
  $("qbCounts").textContent = Object.keys(META.subjects).map(k => `${subjName(k)}: ${qbData.builtinCounts[k]} + ${mine.filter(q => q.subject === k).length}`).join(" · ");
  $("qbList").innerHTML = mine.length ? mine.map(q => `<div class="arow"><div style="min-width:0;flex:1"><b>${esc(qf(q, "q").split("\n")[0])}</b>
      <span class="small">${esc(subjName(q.subject))} · ${esc(domName(q.subject, q.domain))} · ${esc(diffLabel(q.difficulty))} · ${t("answer")}: ${L[q.answer]}</span></div>
      <button class="btn danger sm" type="button" data-qdel="${esc(q.id)}">${t("delete")}</button></div>`).join("") : `<div class="empty">${t("qb_empty")}</div>`;
  $("qbList").querySelectorAll("[data-qdel]").forEach(b => b.onclick = armed(b, async () => {
    try { await api(`/api/teacher/questions/${b.dataset.qdel}`, { method: "DELETE" }, token); loadQB(); }
    catch (err) { b.insertAdjacentHTML("beforebegin", `<span class="status bad">${esc(err.message)}</span>`); b.remove(); }
  }));
}
$("qbForm").addEventListener("submit", async e => {
  e.preventDefault();
  const v = id => $(id).value;
  const body = { subject: v("qbSubj"), domain: v("qbDom"), difficulty: Number(v("qbDiff")), answer: Number(v("qbAns")),
    passage_en: v("qbPass"), q_en: v("qbQen"), q_mn: v("qbQmn"),
    options_en: [0, 1, 2, 3].map(i => v("qbOe" + i)), options_mn: [0, 1, 2, 3].map(i => v("qbOm" + i)), e_en: v("qbEen"), e_mn: v("qbEmn") };
  const st = $("qbStatus");
  try {
    await api("/api/teacher/questions", { method: "POST", body }, token);
    ["qbPass", "qbQen", "qbQmn", "qbEen", "qbEmn", ...[0, 1, 2, 3].flatMap(i => ["qbOe" + i, "qbOm" + i])].forEach(id => $(id).value = "");
    st.className = "status ok"; st.textContent = t("qb_saved"); loadQB();
  } catch (err) { st.className = "status bad"; st.textContent = err.message; }
});

// ---------- эхлэл ----------
renderHeader("teacher");
applyI18n();
onLang(() => {
  setMode(mode); if (META) fillForms();
  if (classData && !$("vDash").hidden) { drawStudents(); drawCo(); drawAssigns(); drawRecurring(); drawAnalysis(); drawQB(); }
  if (resData && !$("vRes").hidden) drawResults();
  if (!$("proj").hidden && projMode === "review") drawProj();
});
loadMeta().then(() => {
  $("demoNote").hidden = !META.demoStorage;
  setMode("login"); fillForms(); loadDash();
}).catch(e => { show("vAuth"); $("authStatus").className = "status bad"; $("authStatus").textContent = e.message; });
