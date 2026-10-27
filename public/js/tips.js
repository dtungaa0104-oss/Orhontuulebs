// «SAT-д бэлтгэх зөвлөгөө» хуудас. Агуулгыг хоёр хэлээр хадгалж, хэл солиход дахин зурна.
const TIPS = {
  mn: {
    eyebrow: "Зөвлөгөө", title: "SAT-д хэрхэн бэлтгэх вэ",
    lead: "Шалгалтын бүтэц, бэлтгэлийн хуваарь, хэсэг бүрийн арга барил, шалгалтын өдрийн бэлтгэл. Монгол сурагчдад тохируулсан.",
    toc: "Агуулга",
    s_format: "Шалгалтын бүтэц",
    format_note: "Digital SAT нь adaptive: хэсэг бүрийн 1-р модульд хялбар, дунд, хүнд асуулт холилдоно. 1-р модулийн гүйцэтгэлээс хамаарч 2-р модуль хүнд эсвэл хялбар болно. Хүнд 2-р модуль руу орох нь өндөр оноо авах нөхцөл тул 1-р модульд онцгой анхаарна.",
    th: ["Хэсэг", "Модуль", "Хугацаа", "Асуулт"],
    rows: [["Reading & Writing", "2 × 32 мин", "64 мин", "54"], ["Завсарлага", "", "10 мин", ""], ["Math", "2 × 35 мин", "70 мин", "44"], ["Нийт", "", "2 цаг 14 мин", "98"]],
    facts: [["400–1600", "Нийт оноо. Хэсэг бүр 200–800."], ["0", "Буруу хариултад оноо хасдаггүй. Бүх асуултад хариулна."], ["Desmos", "Math хэсэгт бүхэлд нь тооны машин ашиглана."], ["Bluebook", "Шалгалтыг энэ программ дээр өгнө."]],
    s_plan: "Бэлтгэлийн хуваарь",
    plan: [
      ["3 сарын өмнө", "Bluebook дээр бүрэн жишиг тест өгч эхлэх оноогоо мэд. Сайтын «Миний зорилго» хэсэгт зорилтот оноо, огноогоо оруул. Долоо хоногт 5 өдөр, өдөрт 30–45 минут."],
      ["2 сарын өмнө", "Сул 2–3 сэдэв дээрээ төвлөр. Өдөр бүр «Өдрийн дасгал», долоо хоног бүр алдааны дэвтрээ цэвэрлэ. Үгсийн сангаас өдөрт 10 үг."],
      ["1 сарын өмнө", "Долоо хоногт 1 бүрэн жишиг тест бодит цагаар. Тест бүрийн дараа алдсан асуулт бүрийн шалтгааныг бич: мэдлэг дутсан уу, анхааралгүй байсан уу, цаг хүрээгүй юу."],
      ["1 долоо хоногийн өмнө", "Шинэ сэдэв үзэхгүй. Алдааны дэвтэр, томьёоны хуудсаа давт. Шалгалтын цагтай ижил цагт 1 тест өг."],
      ["Өмнөх өдөр", "Хөнгөн давтлага л хий. Bluebook-оо шинэчилж, төхөөрөмжөө бүрэн цэнэглэ. 8 цаг унт."]
    ],
    s_rw: "Reading & Writing зөвлөгөө",
    rw: [
      ["Асуулт бүр богино текст", "Асуулт бүр 25–150 үгтэй өөрийн гэсэн тексттэй. Эхлээд асуултаа уншиж, юу хайхаа мэдээд текстээ унш."],
      ["Хариултаа текстээс нотол", "Зөв хариулт текст дэх тодорхой үг, өгүүлбэрээр батлагдана. «Үнэн юм шиг» сонсогдох боловч текстэд байхгүй хувилбар бол хавх."],
      ["Хоосон зайг өөрөө нөхөж үз", "Words in Context асуултад хувилбаруудыг харахаас өмнө хоосон зайд тохирох үгээ өөрөө бод, дараа нь хамгийн ойрыг сонго."],
      ["Холбоос үгсийг ангил", "Эсрэгцэл (However, Nevertheless), үр дагавар (Therefore, Thus), нэмэлт (Moreover, In addition), жишээ (For example). Хоёр өгүүлбэрийн хамаарлыг эхлээд тодорхойл."],
      ["Дүрмийн 5 гол сэдэв", "Өгүүлэгдэхүүн-үйл үгийн тоо, цэг таслал (comma, semicolon, colon), төлөөний үг, үйл үгийн цаг, өгүүлбэрийн бүтэц. Эдгээр нь Conventions хэсгийн ихэнхийг эзэлнэ."]
    ],
    s_math: "Math зөвлөгөө",
    math: [
      ["Desmos-оо эзэмш", "Тэгшитгэлийн систем, квадрат тэгшитгэл, функцийн графикийг Desmos-оор хэдхэн секундэд шийднэ. Шалгалтаас өмнө desmos.com дээр дадлага хий."],
      ["Англи хэлний бодлогыг задал", "Бодлогын өгүүлбэрийг уншаад «юу өгөгдсөн, юу олох вэ» гэдгийг тэмдэглэ. percent of, at least, at most, per, ratio зэрэг үгсийн утгыг сайн мэд."],
      ["Хариугаа шалгах", "Олсон хариугаа анхны нөхцөлд орлуулж шалга. Ихэнх хавх хувилбар нь завсрын хариу (жишээ нь x-ийг олоод 2x-ийг асуусныг мартах)."],
      ["Хариу бичих асуулт", "Зарим асуултад хувилбар байхгүй, хариугаа өөрөө бичнэ. Бутархай, аравтын бутархайг зөвшөөрнө. Сөрөг хариу бол хасах тэмдгээ мартуузай."],
      ["Томьёоны хуудас", "Геометрийн томьёонууд шалгалтын үеэр өгөгддөг. Гэхдээ хаана байгааг нь мэдэж байх нь цаг хэмнэнэ."]
    ],
    s_time: "Цагаа хуваарилах",
    time: [
      ["Reading & Writing", "Асуулт тутамд дунджаар 71 секунд."], ["Math", "Асуулт тутамд дунджаар 95 секунд."],
      ["Тэмдэглэ, үргэлжлүүл", "1.5 минутаас удаж байвал хариултаа таамаглан сонгоод Bluebook-ийн «Mark for Review» тэмдгээр тэмдэглэ. Сүүлд нь буцаж ирнэ."],
      ["Модуль бүрийн төгсгөл", "Сүүлийн 2 минутад хариулаагүй асуулт үлдээхгүй. Оноо хасагддаггүй тул заавал таамагла."]
    ],
    s_mn: "Монгол сурагчдад онцгой зөвлөгөө",
    mn_tips: [
      ["Академик англи хэлээр унш", "Өдөрт 15–20 минут англи хэл дээрх шинжлэх ухаан, түүх, уран зохиолын богино нийтлэл унш. SAT-ийн текстүүд яг ийм төрлийн."],
      ["Орчуулж бодохоос зайлсхий", "Текстийг толгойдоо монгол руу орчуулахад цаг их зарцуулдаг. Англиар шууд ойлгох дадлыг жишиг тестээр хөгжүүл."],
      ["Математикийн нэр томьёо", "slope (налалт), intercept (огтлолцох цэг), mean/median (дундаж/медиан), probability (магадлал), circumference (тойргийн урт) гэх мэт нэр томьёоны жагсаалт гаргаж цээжил."],
      ["Хэлээ сольж давт", "Энэ сайтад асуултаа эхлээд монголоор ойлгож, дараа нь ENG товчоор англи хувилбарыг нь уншаарай. Шалгалт англиар явагдана."]
    ],
    s_day: "Шалгалтын өдрийн жагсаалт",
    day_note: "Тэмдэглэсэн зүйлс энэ төхөөрөмжид хадгалагдана.",
    day: ["Bluebook-ийг шинэчилж, exam setup-аа дуусгасан", "Төхөөрөмж бүрэн цэнэглэгдсэн, цэнэглэгчээ авсан", "Admission ticket (элсэлтийн хуудас) хэвлэсэн эсвэл утсанд хадгалсан", "Иргэний үнэмлэх эсвэл паспорт", "Бал, харандаа (ноорог бичихэд)", "Ус, хөнгөн зууш (завсарлагад)", "Шалгалтын төвд 30 минутын өмнө очих"],
    s_mistakes: "Түгээмэл алдаа",
    mistakes: ["Асуултыг бүтэн уншилгүй хариулах (жишээ нь x биш 2x-ийг асуусан)", "Текстэд байхгүй, гэхдээ «логиктой» сонсогдох хувилбарыг сонгох", "Нэг хүнд асуулт дээр 3–4 минут зарцуулах", "Хариулаагүй асуулт үлдээх (оноо хасагддаггүй)", "Зөвхөн дасгал хийгээд алдаагаа дахин үзэхгүй байх"],
    cta_t: "Одоо дадлага хийх", cta_p: "Зөвлөгөөг хэрэгжүүлэхийн тулд өнөөдрөөс дасгал хийж эхэл.", cta_b1: "Үнэгүй дасгал", cta_b2: "Ангидаа нэвтрэх",
    source: "Шалгалтын бүтцийн эх сурвалж:"
  },
  en: {
    eyebrow: "Tips", title: "How to prepare for the SAT",
    lead: "Test format, a study timeline, strategies for each section, and test-day prep. Written with Mongolian students in mind.",
    toc: "Contents",
    s_format: "Test format",
    format_note: "The Digital SAT is adaptive: the first module of each section mixes easy, medium and hard questions. Your performance there decides whether Module 2 is harder or easier. Reaching the harder Module 2 is what unlocks top scores, so give Module 1 your full attention.",
    th: ["Section", "Modules", "Time", "Questions"],
    rows: [["Reading & Writing", "2 × 32 min", "64 min", "54"], ["Break", "", "10 min", ""], ["Math", "2 × 35 min", "70 min", "44"], ["Total", "", "2 h 14 min", "98"]],
    facts: [["400–1600", "Total score. Each section is 200–800."], ["0", "No penalty for wrong answers. Answer every question."], ["Desmos", "A calculator is available for the whole Math section."], ["Bluebook", "You take the test in this app."]],
    s_plan: "Study timeline",
    plan: [
      ["3 months out", "Take a full practice test in Bluebook to find your starting score. Enter your target and test date under My goal on this site. 30–45 minutes a day, 5 days a week."],
      ["2 months out", "Focus on your 2–3 weakest topics. Do Daily practice every day and clear your mistake notebook every week. Learn 10 words a day."],
      ["1 month out", "One full timed practice test per week. After each, write down why you missed every question: missing knowledge, carelessness, or time."],
      ["1 week out", "No new topics. Review your mistake notebook and the reference sheet. Take one test at the same time of day as the real one."],
      ["The day before", "Light review only. Update Bluebook and fully charge your device. Sleep 8 hours."]
    ],
    s_rw: "Reading & Writing strategies",
    rw: [
      ["One short text per question", "Each question has its own 25–150 word text. Read the question first so you know what to look for, then read the text."],
      ["Prove it from the text", "The right answer is supported by specific words in the text. A choice that sounds true but isn't in the text is a trap."],
      ["Predict the blank", "For Words in Context, think of your own word for the blank before looking at the choices, then pick the closest."],
      ["Sort transitions", "Contrast (However, Nevertheless), result (Therefore, Thus), addition (Moreover, In addition), example (For example). Name the relationship between the sentences first."],
      ["Five core grammar topics", "Subject-verb agreement, punctuation (comma, semicolon, colon), pronouns, verb tense, and sentence structure cover most Conventions questions."]
    ],
    s_math: "Math strategies",
    math: [
      ["Master Desmos", "Systems of equations, quadratics and function graphs take seconds in Desmos. Practice at desmos.com before test day."],
      ["Break down word problems", "Note what's given and what's asked. Know phrases like percent of, at least, at most, per, and ratio."],
      ["Check your answer", "Plug your answer back into the original conditions. Many traps are intermediate answers (finding x when 2x was asked)."],
      ["Student-produced responses", "Some questions have no choices; you type the answer. Fractions and decimals are accepted. Don't forget the minus sign."],
      ["Reference sheet", "Geometry formulas are provided during the test, but knowing where they are saves time."]
    ],
    s_time: "Managing time",
    time: [
      ["Reading & Writing", "About 71 seconds per question."], ["Math", "About 95 seconds per question."],
      ["Mark and move on", "If you pass 1.5 minutes, choose your best guess, flag it with Bluebook's Mark for Review, and come back later."],
      ["End of each module", "Leave nothing blank in the last 2 minutes. There's no penalty, so always guess."]
    ],
    s_mn: "Tips for Mongolian students",
    mn_tips: [
      ["Read academic English", "Read a short English science, history or literature article for 15–20 minutes a day. SAT texts look just like these."],
      ["Avoid translating in your head", "Translating into Mongolian costs time. Build the habit of understanding English directly through practice tests."],
      ["Math vocabulary", "Make a list: slope, intercept, mean/median, probability, circumference and so on, with Mongolian meanings."],
      ["Switch languages while studying", "On this site, understand a question in Mongolian first, then press ENG and read the English version. The real test is in English."]
    ],
    s_day: "Test-day checklist",
    day_note: "Your ticks are saved on this device.",
    day: ["Updated Bluebook and finished exam setup", "Device fully charged, charger packed", "Admission ticket printed or saved on phone", "National ID or passport", "Pens and pencils for scratch work", "Water and a light snack for the break", "Arrive at the test center 30 minutes early"],
    s_mistakes: "Common mistakes",
    mistakes: ["Answering before reading the whole question (it asked for 2x, not x)", "Choosing a logical-sounding option that isn't in the text", "Spending 3–4 minutes on one hard question", "Leaving questions blank (there's no penalty)", "Practicing without reviewing mistakes"],
    cta_t: "Start practicing", cta_p: "Put these tips to work with practice today.", cta_b1: "Free practice", cta_b2: "Join your class",
    source: "Test format source:"
  }
};

function drawTips() {
  const d = TIPS[LANG] || TIPS.mn;
  const sec = [["format", d.s_format], ["plan", d.s_plan], ["rw", d.s_rw], ["math", d.s_math], ["time", d.s_time], ["mn", d.s_mn], ["day", d.s_day], ["mistakes", d.s_mistakes]];
  const cards = list => `<div class="tipgrid">${list.map(([h, p]) => `<div class="tip"><h4>${esc(h)}</h4><p>${esc(p)}</p></div>`).join("")}</div>`;
  const checked = new Set(store.get("o16check", []));
  $("tipsBody").innerHTML = `
    <div class="sec-head"><div><div class="eyebrow">${esc(d.eyebrow)}</div><h1 style="font-size:clamp(28px,4.4vw,46px);font-weight:800;margin-top:8px">${esc(d.title)}</h1><p>${esc(d.lead)}</p></div></div>
    <nav class="toc" aria-label="${esc(d.toc)}">${sec.map(([id, n], i) => `<a href="#${id}"><span class="mono">${String(i + 1).padStart(2, "0")}</span>${esc(n)}</a>`).join("")}</nav>

    <section id="format"><h2>${esc(d.s_format)}</h2>
      <div class="two" style="margin-top:14px">
        <div class="panel"><div class="tablewrap"><table style="min-width:0"><thead><tr>${d.th.map(x => `<th>${esc(x)}</th>`).join("")}</tr></thead>
          <tbody>${d.rows.map((r, i) => `<tr ${i === d.rows.length - 1 ? 'style="font-weight:700"' : ""}>${r.map((c, j) => `<td class="${j ? "num" : ""}">${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
          <p class="small" style="margin-top:12px">${esc(d.format_note)}</p></div>
        <div class="factgrid">${d.facts.map(([b, p]) => `<div class="fact"><b>${esc(b)}</b><span>${esc(p)}</span></div>`).join("")}</div>
      </div></section>

    <section id="plan"><h2>${esc(d.s_plan)}</h2>
      <ol class="timeline">${d.plan.map(([w, p]) => `<li><span class="when">${esc(w)}</span><p>${esc(p)}</p></li>`).join("")}</ol></section>

    <section id="rw"><h2>${esc(d.s_rw)}</h2>${cards(d.rw)}</section>
    <section id="math"><h2>${esc(d.s_math)}</h2>${cards(d.math)}</section>
    <section id="time"><h2>${esc(d.s_time)}</h2>${cards(d.time)}</section>
    <section id="mn"><h2>${esc(d.s_mn)}</h2>${cards(d.mn_tips)}</section>

    <section id="day"><h2>${esc(d.s_day)}</h2>
      <div class="panel" style="margin-top:14px"><div class="checklist">${d.day.map((x, i) => `<label><input type="checkbox" id="chk${i}" data-i="${i}" ${checked.has(i) ? "checked" : ""}><span>${esc(x)}</span></label>`).join("")}</div>
      <p class="small" style="margin-top:10px">${esc(d.day_note)}</p></div></section>

    <section id="mistakes"><h2>${esc(d.s_mistakes)}</h2>
      <ul class="mlist">${d.mistakes.map(x => `<li>${esc(x)}</li>`).join("")}</ul></section>

    <div class="banner" style="justify-content:space-between;padding:20px;margin-top:24px">
      <div><b style="font-size:18px">${esc(d.cta_t)}</b><p class="small" style="margin-top:4px">${esc(d.cta_p)}</p></div>
      <div class="btns"><a class="btn" href="/#practice">${esc(d.cta_b1)}</a><a class="btn ghost" href="/student">${esc(d.cta_b2)}</a></div>
    </div>
    <p class="small" style="margin-top:16px">${esc(d.source)} <a href="https://satsuite.collegeboard.org/digital/whats-on-the-test/structure" target="_blank" rel="noopener">College Board — How the SAT Is Structured</a></p>`;
  $("tipsBody").querySelectorAll(".checklist input").forEach(c => c.onchange = () => {
    const s = new Set(store.get("o16check", []));
    c.checked ? s.add(+c.dataset.i) : s.delete(+c.dataset.i);
    store.set("o16check", [...s]);
  });
}

renderHeader("tips");
applyI18n();
onLang(drawTips);
drawTips();
