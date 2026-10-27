// Нүүр хуудас: үнэгүй дасгал, үгсийн сан, томьёо.
let VOCAB = [["ambiguous", "adjective", "хоёрдмол утгатай", "open to more than one meaning", "The ending of the novel was ambiguous."]];
const FORMULAS = [
  ["Тойргийн талбай", "Area of a circle", "A = πr²"], ["Тойргийн урт", "Circumference", "C = 2πr"],
  ["Тэгш өнцөгт", "Rectangle", "A = lw"], ["Гурвалжин", "Triangle", "A = ½bh"],
  ["Пифагорын теорем", "Pythagorean theorem", "a² + b² = c²"], ["30°-60°-90°", "30°-60°-90°", "x, x√3, 2x"],
  ["45°-45°-90°", "45°-45°-90°", "s, s, s√2"], ["Тэгш өнцөгт параллелепипед", "Rectangular prism", "V = lwh"],
  ["Цилиндр", "Cylinder", "V = πr²h"], ["Бөмбөрцөг", "Sphere", "V = (4/3)πr³"],
  ["Конус", "Cone", "V = (1/3)πr²h"], ["Пирамид", "Pyramid", "V = (1/3)lwh"],
  ["Тойрог", "Circle", "360° = 2π rad"], ["Гурвалжны өнцгүүд", "Triangle angles", "sum = 180°"]
];

let diff = "all", subj = store.get("o16subj", "M"), set = "all", list = [], cur = 0, ans = [], checked = [], finished = false, elapsed = 0, tick = null;

function drawPicker() {
  $("pickSubj").innerHTML = Object.keys(META.subjects).map(k => `<button type="button" class="chip" aria-pressed="${k === subj}" data-k="${k}">${esc(subjName(k))}</button>`).join("");
  $("pickSubj").querySelectorAll("button").forEach(b => b.onclick = () => startSet(b.dataset.k, "all"));
  const doms = ["all", ...Object.keys(META.subjects[subj].domains)];
  $("pickSet").innerHTML = doms.map(d => `<button type="button" class="chip" aria-pressed="${d === set}" data-d="${d}">${esc(domName(subj, d))}</button>`).join("");
  $("pickSet").querySelectorAll("button").forEach(b => b.onclick = () => startSet(subj, b.dataset.d));
  $("pickDiff").innerHTML = ["all", "1", "2", "3"].map(d => `<button type="button" class="chip" aria-pressed="${d === diff}" data-v="${d}">${esc(d === "all" ? t("diff_all") : diffLabel(+d))}</button>`).join("");
  $("pickDiff").querySelectorAll("button").forEach(b => b.onclick = () => { diff = b.dataset.v; startSet(subj, set); });
}

async function startSet(s, d) {
  subj = s; set = d; store.set("o16subj", s);
  clearInterval(tick); tick = null; elapsed = 0; finished = false; cur = 0;
  drawPicker(); $("timer").textContent = "0:00"; $("calcNote").hidden = s !== "M";
  try {
    const r = await api(`/api/practice?subject=${s}&domain=${d}&difficulty=${diff}`);
    list = r.questions;
  } catch (e) { $("qcard").innerHTML = `<p class="status bad">${esc(e.message)}</p>`; return; }
  if (!list.length) { $("qcard").innerHTML = `<div class="empty">—</div>`; $("sheet").innerHTML = ""; return; }
  ans = Array(list.length).fill(null); checked = Array(list.length).fill(false);
  render();
}

function render() {
  if (!list.length) return;
  if (finished && cur === -1) return showResults();
  const q = list[cur];
  let h = questionHTML(q, cur, list.length, { sel: ans[cur], revealed: checked[cur] || finished });
  h += `<div class="qnav"><button class="btn ghost" type="button" id="prev" ${cur === 0 ? "disabled" : ""}>${t("prev")}</button><div class="btns">`;
  if (!checked[cur] && !finished) h += `<button class="btn ghost" type="button" id="check" ${ans[cur] === null ? "disabled" : ""}>${t("check")}</button>`;
  if (finished) h += `<button class="btn ghost" type="button" id="back">${t("back_results")}</button>`;
  if (cur < list.length - 1) h += `<button class="btn" type="button" id="next">${t("next")}</button>`;
  else if (!finished) h += `<button class="btn" type="button" id="next">${t("see_results")}</button>`;
  h += `</div></div>`;
  $("qcard").innerHTML = h;
  $("qcard").querySelectorAll(".opt").forEach(b => b.onclick = () => {
    ans[cur] = +b.dataset.k;
    if (!tick) tick = setInterval(() => { elapsed++; $("timer").textContent = fmt(elapsed); }, 1000);
    render();
  });
  $("prev").onclick = () => { cur--; render(); };
  if ($("next")) $("next").onclick = () => { if (cur === list.length - 1) finish(); else { cur++; render(); } };
  if ($("check")) $("check").onclick = () => { checked[cur] = true; render(); };
  if ($("back")) $("back").onclick = () => { cur = -1; showResults(); };
  drawSheet();
}

function drawSheet() {
  $("sheet").innerHTML = list.map((q, i) => {
    let c = "cell";
    if (finished) c += ans[i] === q.answer ? " r" : " w";
    else if (ans[i] !== null) c += " done";
    if (i === cur && !finished) c += " cur";
    return `<button type="button" class="${c}" data-i="${i}" aria-label="${t("q_of")} ${i + 1}">${i + 1}</button>`;
  }).join("");
  $("sheet").querySelectorAll(".cell").forEach(b => b.onclick = () => { cur = +b.dataset.i; render(); });
  $("finish").disabled = finished;
}

function finish() {
  finished = true; clearInterval(tick); tick = null; cur = -1;
  showResults(); drawSheet();
}

function showResults() {
  const correct = list.filter((q, i) => ans[i] === q.answer).length;
  const byDomain = {};
  list.forEach((q, i) => { byDomain[q.domain] = byDomain[q.domain] || [0, 0]; byDomain[q.domain][1]++; if (ans[i] === q.answer) byDomain[q.domain][0]++; });
  const weak = weakTopics(subj, byDomain);
  $("qcard").innerHTML = `<div class="stack">
    <div class="qmeta"><span class="eyebrow">${esc(subjName(subj))} · ${esc(domName(subj, set))}</span><span class="chip">${correct} / ${list.length} · ${fmt(elapsed)}</span></div>
    <div><div class="small">${t("est_score")}</div><div class="bigscore">${scaled(correct, list.length)}</div></div>
    <p class="small">${t("approx")}</p>
    <div class="eyebrow">${t("by_topic")}</div><div class="stack" style="gap:10px">${topicRows(subj, byDomain)}</div>
    <div class="explain">${weak.length ? `<b>${t("next_step")}</b> ${esc(weak.join(", "))} ${t("redo_topics")}` : `<b>${t("well_done")}</b> ${t("well_done_p")}`}</div>
    <div class="btns"><button class="btn" type="button" id="review">${t("review")}</button><button class="btn ghost" type="button" id="retry">${t("retry")}</button></div></div>`;
  $("review").onclick = () => { cur = 0; render(); };
  $("retry").onclick = () => startSet(subj, set);
}

// vocab
let vi = 0, known = new Set(store.get("o16vocab", []));
function drawV() {
  const w = VOCAB[vi]; $("flip").classList.remove("on");
  $("vWord").textContent = w[0]; $("vPos").textContent = w[1];
  $("vMean").textContent = LANG === "mn" ? w[2] : w[3];
  $("vEx").textContent = "“" + w[4] + "”";
  $("vKnown").textContent = known.size + " / " + VOCAB.length;
  $("vBar").style.width = (known.size / VOCAB.length * 100) + "%";
}
function nextV() { for (let k = 1; k <= VOCAB.length; k++) { const j = (vi + k) % VOCAB.length; if (!known.has(j) || known.size === VOCAB.length) { vi = j; break; } } drawV(); }
$("flip").onclick = () => $("flip").classList.toggle("on");
$("vKnow").onclick = () => { known.add(vi); store.set("o16vocab", [...known]); nextV(); };
$("vAgain").onclick = nextV;
$("vReset").onclick = () => { known = new Set(); store.set("o16vocab", []); vi = 0; drawV(); };
function drawFormulas() {
  $("formulas").innerHTML = FORMULAS.map(f => `<div class="fx"><span class="small">${esc(LANG === "mn" ? f[0] : f[1])}</span><b>${esc(f[2])}</b></div>`).join("");
}

// үгийн тест
let vq = null;
function setVocabMode(quiz) {
  $("vmCards").setAttribute("aria-pressed", !quiz); $("vmQuiz").setAttribute("aria-pressed", quiz);
  $("vCards").hidden = quiz; $("vQuiz").hidden = !quiz;
  if (quiz && !vq) newQuiz(); else if (quiz) drawQuiz();
}
$("vmCards").onclick = () => setVocabMode(false);
$("vmQuiz").onclick = () => setVocabMode(true);
function pickN(arr, n) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); }
function newQuiz() {
  const idxs = pickN(VOCAB.map((_, i) => i), 10);
  vq = { items: idxs.map(i => ({ i, opts: pickN([i, ...pickN(VOCAB.map((_, k) => k).filter(k => k !== i), 3)], 4), sel: null })), cur: 0, score: 0 };
  drawQuiz();
}
function drawQuiz() {
  if (vq.cur >= vq.items.length) {
    $("vQuiz").innerHTML = `<div class="stack"><div class="small">${t("vq_score")}</div><div class="bigscore">${vq.score} / ${vq.items.length}</div><div><button class="btn" type="button" id="vqAgain">${t("vq_again")}</button></div></div>`;
    $("vqAgain").onclick = newQuiz; return;
  }
  const it = vq.items[vq.cur], w = VOCAB[it.i], rev = it.sel !== null;
  const mean = k => LANG === "mn" ? VOCAB[k][2] : VOCAB[k][3];
  $("vQuiz").innerHTML = `<div class="qmeta"><span class="eyebrow">${vq.cur + 1} / ${vq.items.length}</span><span class="chip">${esc(w[1])}</span></div>
    <p class="small">${t("vq_q")}</p><div class="face" style="position:static;border:0;padding:8px 0;align-items:flex-start"><span class="w">${esc(w[0])}</span></div>
    <div class="vq-opts">${it.opts.map((k, j) => {
      let c = "opt"; if (rev) { if (k === it.i) c += " right"; else if (j === it.sel) c += " wrong"; }
      return `<button type="button" class="${c}" data-j="${j}" ${rev ? "disabled" : ""}><span class="bub">${L[j]}</span><span>${esc(mean(k))}</span></button>`; }).join("")}</div>
    ${rev ? `<div class="explain">“${esc(w[4])}”</div><div class="qnav"><span></span><button class="btn" type="button" id="vqNext">${t("next")}</button></div>` : ""}`;
  $("vQuiz").querySelectorAll(".opt").forEach(b => b.onclick = () => { it.sel = +b.dataset.j; if (it.opts[it.sel] === it.i) vq.score++; drawQuiz(); });
  if ($("vqNext")) $("vqNext").onclick = () => { vq.cur++; drawQuiz(); };
}

$("finish").onclick = finish;
renderHeader("home");
applyI18n();
onLang(() => { drawPicker(); if (list.length) { finished && cur === -1 ? showResults() : render(); } drawV(); drawFormulas(); if (vq && !$("vQuiz").hidden) drawQuiz(); });
drawV(); drawFormulas();
api("/api/vocab").then(r => { VOCAB = r.words; known = new Set([...known].filter(i => i < VOCAB.length)); drawV(); }).catch(() => {});
loadMeta().then(() => startSet(subj, "all")).catch(e => { $("qcard").innerHTML = `<p class="status bad">${esc(e.message)}</p>`; });
