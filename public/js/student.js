// Сурагчийн хуудас: самбар, зорилго, хугацаатай тест (adaptive), алдааны дэвтэр, өдрийн дасгал, шууд асуулт.
let token = store.get("o16st", null);
let me = null, test = null, cur = 0, answers = {}, tick = null, clockOffset = 0, submitting = false, armed = false, result = null;
const VIEWS = ["vJoin", "vList", "vTest", "vResult", "vMist", "vLive"];
function show(v) { VIEWS.forEach(id => $(id).hidden = id !== v); window.scrollTo(0, 0); }
const visible = id => !$(id).hidden;
const dt = ms => new Date(ms).toLocaleString(LANG === "mn" ? "mn-MN" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

// ---------- нэвтрэх ----------
$("joinForm").addEventListener("submit", async e => {
  e.preventDefault();
  $("jStatus").className = "status"; $("jStatus").textContent = "…";
  try {
    const r = await api("/api/student/join", { method: "POST", body: { code: $("jCode").value, name: $("jName").value, pin: $("jPin").value } });
    token = r.token; store.set("o16st", token); $("jStatus").textContent = ""; loadList();
  } catch (err) { $("jStatus").className = "status bad"; $("jStatus").textContent = err.message; }
});
$("logout").onclick = () => { store.del("o16st"); token = null; show("vJoin"); };

// ---------- самбар ----------
const statusPill = s => ({ open: "mid", in_progress: "mid", submitted: "ok", late: "bad", expired: "bad", closed: "mute" }[s] || "mute");
async function loadList() {
  if (!token) return show("vJoin");
  await flushPending();
  try { me = await api("/api/student/me", {}, token); }
  catch (e) {
    if (e.status === 401) { store.del("o16st"); token = null; return show("vJoin"); }
    $("aList").innerHTML = `<p class="status bad">${esc(e.message)}</p>`; return show("vList");
  }
  clockOffset = me.serverTime - Date.now();
  drawList(); show("vList"); pollLive();
}
function drawList() {
  const p = me.profile;
  $("lClass").textContent = me.class.name;
  $("lName").textContent = me.student.name;
  $("sStreak").textContent = p.streak.current;
  $("sBest").textContent = `${t("best")}: ${p.streak.best}`;
  const daily = p.plan ? p.plan.daily : 10;
  $("sToday").textContent = `${p.todayQ} / ${daily}`;
  $("sTodayBar").style.width = Math.min(100, p.todayQ / daily * 100) + "%";
  $("mistCount").textContent = me.mistakesCount;
  $("mistOpen").disabled = !me.mistakesCount;
  // даалгаврууд
  $("aList").innerHTML = me.assignments.length ? me.assignments.map(a => {
    const can = a.status === "open" || a.status === "in_progress";
    const scoreTxt = a.correct !== null ? ` · ${a.correct}/${a.questionCount} · ${a.score}` : "";
    const tags = [a.mode === "adaptive" ? `<span class="pill mid">SAT · 2 ${t("module")}</span>` : "", a.targeted ? `<span class="pill ok">${t("targeted")}</span>` : "",
      a.difficulty ? `<span class="pill mute">${esc(diffLabel(+a.difficulty))}</span>` : ""].join(" ");
    return `<div class="arow"><div style="min-width:0"><b>${esc(a.title)}</b>
      <span class="small">${esc(subjName(a.subject))} · ${esc(domName(a.subject, a.domain))} · ${a.questionCount} ${t("questions")} · ${a.timeLimitMin} ${t("minutes")}${a.dueAt ? ` · ${t("due")}: ${esc(dt(a.dueAt))}` : ""}</span>
      <div class="btns" style="margin-top:4px">${tags}</div></div>
      <div class="btns"><span class="pill ${statusPill(a.status)}">${t("st_" + a.status)}${scoreTxt}</span>
      ${can ? `<button class="btn sm" type="button" data-start="${esc(a.id)}">${a.status === "in_progress" ? t("resume") : t("start")}</button>` : ""}</div></div>`;
  }).join("") + `<p class="small" style="margin-top:6px">${t("confirm_start")}</p>` : `<div class="empty">${t("no_assignments")}</div>`;
  $("aList").querySelectorAll("[data-start]").forEach(b => b.onclick = () => startTest(b.dataset.start));
  // график, зорилго, тэмдэг, самбар
  $("chart").innerHTML = lineChart(p.history);
  drawGoal();
  $("badges").innerHTML = badgesHTML(p.badges);
  $("board").innerHTML = me.board.map((r, i) => `<div class="boardrow ${r.me ? "me" : ""}"><span class="mono">${i + 1}</span><span>${esc(r.me ? `${r.name} (${t("you")})` : r.name)}</span><span class="mono">${r.week}</span></div>`).join("");
}
function drawGoal() {
  const p = me.profile;
  if (p.goal) { $("gTarget").value = p.goal.target; $("gDate").value = p.goal.examDay; }
  if (!p.plan) { $("goalView").innerHTML = `<p class="small">${t("goal_none")}</p>`; return; }
  const pl = p.plan;
  $("goalView").innerHTML = `<div class="stats">
      <div class="stat"><span class="eyebrow">${t("goal_target")}</span><b>${pl.target}</b><span class="small">${pl.daysLeft} ${t("days_left")}</span></div>
      <div class="stat"><span class="eyebrow">${t("est_now")}</span><b>${pl.current}</b><span class="small">${t("gap")}: ${pl.gap}</span></div>
      <div class="stat"><span class="eyebrow">${t("daily_goal")}</span><b>${pl.daily}</b><span class="small">${t("q_today")}</span></div></div>
    <div class="bar"><i style="width:${Math.min(100, Math.max(4, (pl.current - 400) / Math.max(1, pl.target - 400) * 100))}%"></i></div>`;
}
$("goalForm").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    await api("/api/student/goal", { method: "POST", body: { target: Number($("gTarget").value), examDay: $("gDate").value } }, token);
    $("gStatus").className = "status ok"; $("gStatus").textContent = t("saved");
    me = await api("/api/student/me", {}, token); drawList();
  } catch (err) { $("gStatus").className = "status bad"; $("gStatus").textContent = err.message; }
});

// ---------- хугацаатай тест ----------
async function startTest(id) {
  try { test = await api(`/api/student/assignments/${id}/start`, { method: "POST" }, token); }
  catch (e) { return listError(e.message); }
  clockOffset = test.serverTime - Date.now();
  answers = store.get("o16ans:" + id, {});
  cur = 0; submitting = false; armed = false;
  $("tTitle").textContent = test.assignment.title;
  $("calcNote").hidden = test.assignment.subject !== "M";
  $("sStatus").textContent = "";
  drawTestMeta(); renderQ(); show("vTest");
  clearInterval(tick); tick = setInterval(drawTimer, 500); drawTimer();
}
function listError(msg) { loadList().then(() => $("aList").insertAdjacentHTML("afterbegin", `<p class="status bad">${esc(msg)}</p>`)); }
function drawTestMeta() {
  const a = test.assignment;
  let m = `${subjName(a.subject)} · ${domName(a.subject, a.domain)} · ${test.questions.length} ${t("questions")}`;
  if (test.stage === "m1") m = `${t("module")} 1 / 2 · ` + m;
  if (test.stage === "m2") m = `${t("module")} 2 / 2 · ` + m;
  $("tMeta").textContent = m;
  $("submit").textContent = test.stage === "m1" ? t("module_next") : t("finish");
}
const remaining = () => (test.deadline - (Date.now() + clockOffset)) / 1000;
function drawTimer() {
  const r = remaining();
  $("timer").textContent = fmt(r);
  $("timer").classList.toggle("low", r < 60);
  if (r <= 0 && !submitting) { $("sStatus").className = "status"; $("sStatus").textContent = t("auto_submit"); finishAll(true); }
}
function renderQ() {
  const q = test.questions[cur];
  const forced = test.assignment.qlang;
  $("tQl").hidden = test.assignment.subject !== "M";
  $("tQlBox").innerHTML = forced === "en" ? qlangSwitch(true) : forced === "both" ? `<span class="pill mid">${esc(t("ql_both"))}</span>` : qlangSwitch(false);
  if (!forced) bindQlang($("tQlBox"), renderQ);
  let h = questionHTML(q, cur, test.questions.length, { sel: answers[q.id] ?? null, revealed: false, qlang: forced || undefined });
  h += `<div class="qnav"><button class="btn ghost" type="button" id="prev" ${cur === 0 ? "disabled" : ""}>${t("prev")}</button>
        <button class="btn" type="button" id="next" ${cur === test.questions.length - 1 ? "disabled" : ""}>${t("next")}</button></div>`;
  $("qcard").innerHTML = h;
  $("qcard").querySelectorAll(".opt").forEach(b => b.onclick = () => {
    answers[q.id] = +b.dataset.k; store.set("o16ans:" + test.assignment.id, answers); armed = false; renderQ();
  });
  $("prev").onclick = () => { cur--; renderQ(); };
  $("next").onclick = () => { cur++; renderQ(); };
  drawSheet();
}
function drawSheet() {
  $("sheet").innerHTML = test.questions.map((q, i) => `<button type="button" class="cell ${answers[q.id] !== undefined ? "done" : ""} ${i === cur ? "cur" : ""}" data-i="${i}" aria-label="${t("q_of")} ${i + 1}">${i + 1}</button>`).join("");
  $("sheet").querySelectorAll(".cell").forEach(b => b.onclick = () => { cur = +b.dataset.i; renderQ(); });
}
$("submit").onclick = () => {
  const left = test.questions.filter(q => answers[q.id] === undefined).length;
  if (!armed) {
    armed = true; $("sStatus").className = "status bad";
    $("sStatus").textContent = (left ? `${left} ${t("unanswered")} ` : "") + t("confirm_submit");
    return;
  }
  if (test.stage === "m1") toModule2(); else finishAll(false);
};
async function toModule2() {
  if (submitting) return;
  submitting = true; $("submit").disabled = true;
  try {
    const r = await api(`/api/student/assignments/${test.assignment.id}/module1`, { method: "POST", body: { answers } }, token);
    test.stage = "m2"; test.questions = r.questions; test.deadline = r.deadline; cur = 0; armed = false;
    $("sStatus").className = "status ok"; $("sStatus").textContent = t("module") + " 2";
    drawTestMeta(); renderQ();
  } catch (e) { $("sStatus").className = "status bad"; $("sStatus").textContent = t("net_retry"); }
  submitting = false; $("submit").disabled = false;
}
// Цаг дуусах эсвэл эцсийн илгээлт. Сүлжээгүй бол хадгалаад дараа илгээнэ.
async function finishAll(auto) {
  if (submitting) return;
  submitting = true; $("submit").disabled = true;
  const id = test.assignment.id, stage = test.stage;
  try {
    result = await sendAttempt(id, stage, answers);
    clearInterval(tick); tick = null;
    store.del("o16ans:" + id);
    rev = -1; showResult();
  } catch (e) {
    if (e.status && e.status < 500) { submitting = false; $("submit").disabled = false; $("sStatus").className = "status bad"; $("sStatus").textContent = e.message; return; }
    pending.add({ id, stage, answers });
    clearInterval(tick); tick = null;
    $("offline").hidden = false;
    $("sStatus").className = "status bad"; $("sStatus").textContent = t("offline");
    submitting = false;
  }
}
async function sendAttempt(id, stage, ans) {
  if (stage === "m1") await api(`/api/student/assignments/${id}/module1`, { method: "POST", body: { answers: ans } }, token);
  return api(`/api/student/assignments/${id}/submit`, { method: "POST", body: { answers: ans } }, token);
}
async function flushPending() {
  const list = pending.all();
  if (!list.length || !token) return;
  for (const p of list) {
    try { await sendAttempt(p.id, p.stage, p.answers); pending.remove(p.id); store.del("o16ans:" + p.id); }
    catch (e) { if (e.status && e.status < 500) pending.remove(p.id); }
  }
  if (!pending.all().length) {
    $("offline").hidden = true;
    if (visible("vTest")) { loadList().then(() => $("aList").insertAdjacentHTML("afterbegin", `<p class="status ok">${t("pending_sent")}</p>`)); }
  }
}
window.addEventListener("online", flushPending);
window.addEventListener("offline", () => { if (visible("vTest")) $("offline").hidden = false; });
setInterval(flushPending, 15000);

// ---------- үр дүн ----------
let rev = -1;
function showResult() {
  const s = test.assignment.subject, r = result;
  if (rev >= 0) {
    const q = r.questions[rev];
    $("rCard").innerHTML = questionHTML(q, rev, r.questions.length, { sel: r.answers[q.id] ?? null, revealed: true, qlang: test.assignment.qlang === "en" ? "both" : undefined }) +
      `<div class="qnav"><button class="btn ghost" type="button" id="rp" ${rev === 0 ? "disabled" : ""}>${t("prev")}</button>
       <div class="btns"><button class="btn ghost" type="button" id="rb">${t("back_results")}</button>
       <button class="btn" type="button" id="rn" ${rev === r.questions.length - 1 ? "disabled" : ""}>${t("next")}</button></div></div>`;
    $("rp").onclick = () => { rev--; showResult(); };
    $("rn").onclick = () => { rev++; showResult(); };
    $("rb").onclick = () => { rev = -1; showResult(); };
  } else {
    const weak = weakTopics(s, r.byDomain);
    $("rCard").innerHTML = `<div class="stack">
      <div class="qmeta"><span class="eyebrow">${esc(test.assignment.title)}</span><span class="chip">${r.correct} / ${r.total} · ${fmt(r.seconds)}</span></div>
      <p class="status ${r.late ? "bad" : "ok"}">${r.late ? t("sent_late") : t("sent_ok")}</p>
      <div><div class="small">${t("est_score")}${r.path ? ` · ${t(r.path === "hard" ? "path_hard" : "path_easy")}` : ""}</div><div class="bigscore">${r.score}</div></div>
      <div class="eyebrow">${t("by_topic")}</div><div class="stack" style="gap:10px">${topicRows(s, r.byDomain)}</div>
      <div class="explain">${weak.length ? `<b>${t("next_step")}</b> ${esc(weak.join(", "))} ${t("redo_topics")}` : `<b>${t("well_done")}</b> ${t("well_done_p")}`}</div>
      <div class="btns"><button class="btn" type="button" id="rv">${t("review")}</button><button class="btn ghost" type="button" id="bl">${t("back_list")}</button></div></div>`;
    $("rv").onclick = () => { rev = 0; showResult(); };
    $("bl").onclick = () => { rev = -1; loadList(); };
  }
  show("vResult");
}

// ---------- алдааны дэвтэр ба өдрийн дасгал ----------
let pr = null; // {mode:"mist"|"daily", items, i, sel, res, results}
$("mistOpen").onclick = async () => {
  try { const m = await api("/api/student/mistakes", {}, token); pr = { mode: "mist", mastered: m.mastered, items: m.items, i: 0, sel: null, res: null }; } catch (e) { return; }
  drawPr(); show("vMist");
};
$("dailyOpen").onclick = async () => {
  try { const d = await api("/api/student/daily", {}, token); pr = { mode: "daily", items: d.questions.map(q => ({ question: q })), i: 0, sel: null, res: null, answers: {}, correct: 0, subject: d.subject }; } catch (e) { return; }
  drawPr(); show("vMist");
};
$("mBack").onclick = () => loadList();
function drawPr() {
  const daily = pr.mode === "daily";
  $("mTitle").textContent = daily ? t("daily_title") : t("mist_title");
  $("mLead").textContent = daily ? t("daily_lead") : t("mist_lead");
  const items = pr.items;
  $("mQl").innerHTML = qlangSwitch(false); bindQlang($("mQl"), drawPr);
  $("mMeta").textContent = daily ? `${Math.min(pr.i + 1, items.length)} / ${items.length}` : (items.length ? `${items.length} ${t("mist_left")}` : "");
  if (daily && pr.i >= items.length) return finishDaily();
  if (!items.length) {
    $("mCard").innerHTML = `<div class="stack"><p class="status ok">${t("mist_done")}</p><div><button class="btn" type="button" id="mDone">${t("back_list")}</button></div></div>`;
    $("mDone").onclick = () => loadList(); return;
  }
  if (pr.i >= items.length) pr.i = 0;
  const it = items[pr.i];
  const q = pr.res ? pr.res.question : it.question;
  let h = questionHTML(q, pr.i, items.length, { sel: pr.sel, revealed: !!pr.res });
  if (!daily) {
    const streak = pr.res ? pr.res.streak : it.streak;
    h += `<div class="btns" style="margin-top:12px"><span class="small">${t("mist_progress")}:</span> ${Array.from({ length: pr.mastered }, (_, k) => `<span class="pill ${k < streak ? "ok" : "mute"}">${k < streak ? "✓" : "·"}</span>`).join(" ")}</div>`;
    if (pr.res && pr.res.removed) h += `<p class="status ok" style="margin-top:8px">${t("mist_removed")}</p>`;
  }
  h += `<div class="qnav"><span></span><div class="btns">${pr.res ? `<button class="btn" type="button" id="mNext">${t("next")}</button>` : `<button class="btn" type="button" id="mCheck" ${pr.sel === null ? "disabled" : ""}>${t("check")}</button>`}</div></div>`;
  $("mCard").innerHTML = h;
  $("mCard").querySelectorAll(".opt").forEach(b => b.onclick = () => { pr.sel = +b.dataset.k; drawPr(); });
  if ($("mCheck")) $("mCheck").onclick = async () => {
    if (daily) {
      pr.answers[it.question.id] = pr.sel;
      if (pr.sel === it.question.answer) pr.correct++;
      pr.res = { question: it.question };
    } else {
      try { pr.res = await api("/api/student/mistakes/check", { method: "POST", body: { questionId: it.question.id, choice: pr.sel } }, token); } catch (e) { return; }
      it.streak = pr.res.streak;
    }
    drawPr();
  };
  if ($("mNext")) $("mNext").onclick = () => {
    if (!daily && pr.res.removed) items.splice(pr.i, 1); else pr.i++;
    pr.sel = null; pr.res = null; drawPr();
  };
}
async function finishDaily() {
  $("mCard").innerHTML = `<p class="small">…</p>`;
  try { await api("/api/student/daily", { method: "POST", body: { answers: pr.answers } }, token); } catch (e) {}
  $("mCard").innerHTML = `<div class="stack"><p class="status ok">${t("daily_done")}</p>
    <div class="bigscore">${pr.correct} / ${pr.items.length}</div>
    <div><button class="btn" type="button" id="dDone">${t("back_list")}</button></div></div>`;
  $("dDone").onclick = () => loadList();
}

// ---------- шууд асуулт ----------
let live = null, liveTimer = null, liveSel = null;
async function pollLive() {
  clearTimeout(liveTimer);
  if (!token) return;
  if (visible("vList") || visible("vLive")) {
    try { const r = await api("/api/student/live", {}, token); live = r.live; } catch (e) {}
    $("liveBanner").hidden = !live;
    if (visible("vLive")) drawLive();
  }
  liveTimer = setTimeout(pollLive, visible("vLive") ? 2000 : 5000);
}
$("liveJoin").onclick = () => { show("vLive"); drawLive(); pollLive(); };
$("lvBack").onclick = () => loadList();
function drawLive() {
  if (!live) { $("lvMeta").textContent = ""; $("lvCard").innerHTML = `<p class="status">${t("live_ended")}</p>`; return; }
  if (live.idx !== drawLive.lastIdx) { liveSel = null; drawLive.lastIdx = live.idx; }
  $("lvQl").innerHTML = live.question && live.question.subject === "M" ? qlangSwitch(false) : ""; bindQlang($("lvQl"), drawLive);
  $("lvMeta").textContent = `${live.title} · ${live.idx + 1} / ${live.total}`;
  const q = live.question, mine = live.myChoice;
  if (!q) { $("lvCard").innerHTML = `<p class="small">${t("live_wait")}</p>`; return; }
  const revealed = live.state === "reveal";
  let h = questionHTML(q, live.idx, live.total, { sel: mine ?? liveSel, revealed });
  if (!revealed && mine !== null) h += `<p class="status ok" style="margin-top:12px">${t("live_sent")}</p>`;
  if (revealed) h += `<p class="small" style="margin-top:12px">${t("live_wait")}</p>`;
  $("lvCard").innerHTML = h;
  if (!revealed) $("lvCard").querySelectorAll(".opt").forEach(b => b.onclick = async () => {
    liveSel = +b.dataset.k;
    try { await api("/api/student/live/answer", { method: "POST", body: { sessionId: live.id, idx: live.idx, choice: liveSel } }, token); live.myChoice = liveSel; } catch (e) {}
    drawLive();
  });
}

// ---------- эхлэл ----------
renderHeader("student");
applyI18n();
onLang(() => {
  if (visible("vList") && me) drawList();
  if (visible("vTest") && test) { drawTestMeta(); renderQ(); }
  if (visible("vResult") && result) showResult();
  if (visible("vMist") && pr) drawPr();
  if (visible("vLive")) drawLive();
});
loadMeta().then(loadList).catch(e => { show("vJoin"); $("jStatus").className = "status bad"; $("jStatus").textContent = e.message; });
