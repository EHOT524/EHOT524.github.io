/* Таблица растворимости и ряд активности металлов: вкладки калькулятора химии и лаборатории.
   Данные в chem-tables.js собирает tools/export_chem_lab.py из бота, поэтому ответы заданий и таблица совпадают.
   Подключение: <script src="chem-tables.js"></script><script src="chemref.js"></script>,
   затем ChemRef.solubility(контейнер) или ChemRef.activity(контейнер). */
(function () {
  "use strict";
  const T = CHEM_TABLES;  // объявлен через const в chem-tables.js: это общая переменная страницы, но не свойство window
  const WORDS = { "Р": "растворимо", "М": "малорастворимо", "Н": "нерастворимо", "—": "в воде не существует", "": "в учебниках по-разному" };

  const CSS = `
.cr { display: grid; gap: 10px; min-width: 0; font-family: var(--body, system-ui); color: var(--ink); }
.cr-card { background: var(--sheet); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; font-size: 14px; line-height: 1.45; display: grid; gap: 4px; }
.cr-card b.big { font: 700 22px var(--mono, monospace); }
.cr-muted { color: var(--muted); font-size: 13px; }
.cr-scroll { overflow: auto; -webkit-overflow-scrolling: touch; border: 1px solid var(--line); border-radius: 8px; background: var(--sheet); max-height: 62vh; }
.cr-table { border-collapse: separate; border-spacing: 0; font: 600 13px var(--mono, monospace); }
.cr-table th, .cr-table td { width: 38px; min-width: 38px; height: 34px; text-align: center; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 0; }
.cr-table th { background: var(--paper); color: var(--ink); font-weight: 600; font-size: 12px; position: sticky; top: 0; z-index: 1; }
.cr-table th.row { position: sticky; left: 0; z-index: 2; min-width: 52px; }
.cr-table thead th.row { z-index: 3; }
.cr-table td { cursor: pointer; color: #14304d; }
.cr-table td.R { background: #dff2e1; } .cr-table td.M { background: #fbeab0; } .cr-table td.N { background: #f9d6d5; }
.cr-table td.X { background: #e4e7eb; color: #566b80; } .cr-table td.U { background: transparent; color: var(--muted); }
.cr-table td.on { outline: 3px solid var(--accent); outline-offset: -3px; }
.cr-table tr.hl th.row, .cr-table th.hl { background: var(--accent); color: var(--accent-ink); }
.cr-legend { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; color: var(--muted); }
.cr-legend span::before { content: ""; display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 4px; vertical-align: -1px; background: var(--c); }
.cr-row { display: flex; flex-wrap: wrap; gap: 4px; }
.cr-metal { font: 700 15px var(--mono, monospace); min-width: 46px; padding: 8px 6px 6px; border-radius: 6px; border: 1px solid var(--line); background: var(--sheet); color: var(--ink); cursor: pointer; display: grid; justify-items: center; gap: 2px; }
.cr-metal small { font: 400 9px var(--body, system-ui); color: var(--muted); }
.cr-metal.z1 { border-bottom: 4px solid #e07a5f; } .cr-metal.z2 { border-bottom: 4px solid #f2c14e; } .cr-metal.z3 { border-bottom: 4px solid #4f9d69; }
.cr-metal.h { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
.cr-metal.h small { color: var(--accent-ink); }
.cr-metal.on { outline: 3px solid var(--accent); outline-offset: 1px; }
.cr-metal.dim { opacity: .45; }
.cr-rules { margin: 0; padding-left: 18px; display: grid; gap: 4px; font-size: 14px; line-height: 1.45; }
`;

  function el(tag, attrs = {}, ...kids) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") node.className = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) node.setAttribute(k, v);
    }
    for (const kid of kids.flat(Infinity)) if (kid != null) node.append(kid);
    return node;
  }
  const style = () => { if (!document.getElementById("cr-style")) document.head.append(el("style", { id: "cr-style" }, CSS)); };
  const CLS = { "Р": "R", "М": "M", "Н": "N", "—": "X", "": "U" };

  function solubilityCard(a, c, cell) {
    if (!a) return el("div", { class: "cr-card" }, el("span", { class: "cr-muted" },
      "Нажми на клетку: покажу вещество и что это значит для реакции. Строки — анионы (кислотные остатки), столбцы — катионы."));
    const name = `${a.salt} ${c.name}`;
    const meaning = {
      "Р": "В растворе распадается на ионы. В реакции обмена осадка не даёт.",
      "М": "Растворяется немного: при смешивании растворов часто выпадает муть или осадок.",
      "Н": "В реакции обмена выпадает в осадок, поэтому такая реакция идёт до конца.",
      "—": "Водой разлагается, поэтому в растворе его получить нельзя.",
      "": "В разных таблицах указано по-разному. На экзамене смотри таблицу ФИПИ, которую дадут вместе с заданиями.",
    }[cell.v];
    return el("div", { class: "cr-card", "aria-live": "polite" },
      el("div", {}, el("b", { class: "big" }, cell.f), " — ", name),
      el("div", {}, el("b", {}, cell.v || "?"), ` — ${WORDS[cell.v]}. ${meaning}`),
      el("div", { class: "cr-muted" }, `Ионы: ${c.ion} и ${a.ion}${a.acid ? `, кислота ${a.acid}` : ""}`));
  }

  function solubility(root) {
    style();
    const box = el("div");
    let on = null;
    const head = el("tr", {}, el("th", { class: "row" }, ""), T.cations.map(c => el("th", { "data-c": c.key }, c.ion)));
    const body = T.anions.map(a => el("tr", { "data-a": a.key }, el("th", { class: "row" }, a.ion),
      T.cations.map(c => {
        const cell = T.cells[a.key][c.key];
        return el("td", { class: CLS[cell.v], title: `${cell.f}: ${WORDS[cell.v]}`, "aria-label": `${a.salt} ${c.name}: ${WORDS[cell.v]}`,
          onclick: e => choose(e.currentTarget, a, c, cell) }, cell.v || "·");
      })));
    const table = el("table", { class: "cr-table" }, el("thead", {}, head), el("tbody", {}, body));
    function choose(td, a, c, cell) {
      if (on) on.classList.remove("on");
      table.querySelectorAll(".hl").forEach(x => x.classList.remove("hl"));
      on = td;
      td.classList.add("on");
      td.parentElement.classList.add("hl");
      table.querySelector(`th[data-c="${c.key}"]`).classList.add("hl");
      box.replaceChildren(solubilityCard(a, c, cell));
    }
    box.replaceChildren(solubilityCard());
    const legend = el("div", { class: "cr-legend" },
      [["#dff2e1", "Р — растворимо"], ["#fbeab0", "М — малорастворимо"], ["#f9d6d5", "Н — нерастворимо"], ["#e4e7eb", "— не существует"],
       ["transparent", "· по-разному"]].map(([c, t]) => el("span", { style: `--c:${c}` }, t)));
    root.replaceChildren(el("div", { class: "cr" }, box, el("div", { class: "cr-scroll" }, table), legend));
  }

  function activityCard(i) {
    const row = T.activity, h = row.findIndex(m => m.s === "H");
    if (i == null) return el("div", { class: "cr-card" }, el("span", { class: "cr-muted" },
      "Нажми на металл: покажу, кого он вытесняет и с чем реагирует. Чем левее металл, тем он активнее."));
    const m = row[i];
    if (m.s === "H") return el("div", { class: "cr-card" }, el("div", {}, el("b", { class: "big" }, "H"), " — водород, не металл"),
      el("div", {}, "Стоит в ряду для сравнения: металлы левее H вытесняют водород из соляной и разбавленной серной кислоты, правее — нет."));
    const right = row.slice(i + 1).filter(x => x.s !== "H").map(x => x.s);
    const lines = [];
    if (i < 5) lines.push("Очень активный: при обычных условиях реагирует с водой, получается щёлочь и водород. Поэтому из растворов солей другие металлы не вытесняет: сначала реагирует с водой.");
    lines.push(i < h ? "Левее H: вытесняет водород из соляной и разбавленной серной кислоты."
      : ["Pt", "Au"].includes(m.s) ? "Правее H: водород из кислот не вытесняет. С азотной и серной кислотой тоже не реагирует, растворяется только в царской водке (смесь HNO₃ и HCl)."
      : "Правее H: водород из кислот не вытесняет. Реагирует только с кислотами-окислителями: азотной и концентрированной серной.");
    if (i >= 5 && right.length) lines.push(`Вытесняет из растворов солей металлы правее себя: ${right.join(", ")}.`);
    if (!right.length) lines.push("Самый неактивный: никого не вытесняет, его вытесняют все металлы левее.");
    lines.push(i <= row.findIndex(x => x.s === "Al") ? "Электролиз раствора соли: на катоде выделяется только водород, металл не получается."
      : i < h ? "Электролиз раствора соли: на катоде и металл, и водород." : "Электролиз раствора соли: на катоде выделяется металл.");
    return el("div", { class: "cr-card", "aria-live": "polite" }, el("div", {}, el("b", { class: "big" }, m.s), ` — ${m.name}`),
      el("ul", { class: "cr-rules" }, lines.map(t => el("li", {}, t))));
  }

  function activity(root) {
    style();
    const box = el("div");
    const row = T.activity, h = row.findIndex(m => m.s === "H"), al = row.findIndex(m => m.s === "Al");
    const buttons = row.map((m, i) => el("button", { type: "button", class: `cr-metal ${m.s === "H" ? "h" : i <= al ? "z1" : i < h ? "z2" : "z3"}`,
      "aria-label": m.name, onclick: () => choose(i) }, m.s, el("small", {}, m.name)));
    function choose(i) {
      buttons.forEach((b, j) => b.classList.toggle("on", j === i));
      box.replaceChildren(activityCard(i));
    }
    box.replaceChildren(activityCard());
    const rules = el("ul", { class: "cr-rules" },
      el("li", {}, "Слева направо активность падает: левый металл вытесняет правый из раствора его соли (Fe + CuSO₄ → FeSO₄ + Cu)."),
      el("li", {}, "Металлы левее H вытесняют водород из HCl и разбавленной H₂SO₄. Азотная кислота водород не даёт ни с одним металлом."),
      el("li", {}, "Li, K, Ba, Ca, Na реагируют с водой, поэтому для вытеснения металлов из солей их не берут."));
    const legend = el("div", { class: "cr-legend" },
      [["#e07a5f", "до Al: на катоде только H₂"], ["#f2c14e", "от Mn до H: металл и H₂"], ["#4f9d69", "после H: только металл"]]
        .map(([c, t]) => el("span", { style: `--c:${c}` }, t)));
    root.replaceChildren(el("div", { class: "cr" }, el("div", { class: "cr-row", role: "list", "aria-label": "Ряд активности металлов" }, buttons),
      legend, box, el("div", { class: "cr-card" }, rules)));
  }

  window.ChemRef = { solubility, activity };
})();
