/* Таблица Менделеева для калькулятора (вкладка в задачах химии) и химической лаборатории.
   Подключение: <script src="ptable.js"></script>, затем PTable.mount(контейнер, { onUse(ar), onBuild(z) }).
   Массы в клетках как в школьных задачах: целые, хлор 35,5. Точные массы — в карточке элемента.
   Степени окисления у элементов из бота совпадают с ботом (это сверяет selfcheck.py). */
(function () {
  "use strict";
  const RAW = `H водород 1.008|He гелий 4.0026|Li литий 6.94|Be бериллий 9.0122|B бор 10.81|C углерод 12.011|N азот 14.007|O кислород 15.999|F фтор 18.998|Ne неон 20.180|
Na натрий 22.990|Mg магний 24.305|Al алюминий 26.982|Si кремний 28.085|P фосфор 30.974|S сера 32.06|Cl хлор 35.45|Ar аргон 39.95|K калий 39.098|Ca кальций 40.078|
Sc скандий 44.956|Ti титан 47.867|V ванадий 50.942|Cr хром 51.996|Mn марганец 54.938|Fe железо 55.845|Co кобальт 58.933|Ni никель 58.693|Cu медь 63.546|Zn цинк 65.38|
Ga галлий 69.723|Ge германий 72.630|As мышьяк 74.922|Se селен 78.971|Br бром 79.904|Kr криптон 83.798|Rb рубидий 85.468|Sr стронций 87.62|Y иттрий 88.906|Zr цирконий 91.224|
Nb ниобий 92.906|Mo молибден 95.95|Tc технеций [98]|Ru рутений 101.07|Rh родий 102.91|Pd палладий 106.42|Ag серебро 107.87|Cd кадмий 112.41|In индий 114.82|Sn олово 118.71|
Sb сурьма 121.76|Te теллур 127.60|I иод 126.90|Xe ксенон 131.29|Cs цезий 132.91|Ba барий 137.33|La лантан 138.91|Ce церий 140.12|Pr празеодим 140.91|Nd неодим 144.24|
Pm прометий [145]|Sm самарий 150.36|Eu европий 151.96|Gd гадолиний 157.25|Tb тербий 158.93|Dy диспрозий 162.50|Ho гольмий 164.93|Er эрбий 167.26|Tm тулий 168.93|Yb иттербий 173.05|
Lu лютеций 174.97|Hf гафний 178.49|Ta тантал 180.95|W вольфрам 183.84|Re рений 186.21|Os осмий 190.23|Ir иридий 192.22|Pt платина 195.08|Au золото 196.97|Hg ртуть 200.59|
Tl таллий 204.38|Pb свинец 207.2|Bi висмут 208.98|Po полоний [209]|At астат [210]|Rn радон [222]|Fr франций [223]|Ra радий [226]|Ac актиний [227]|Th торий 232.04|
Pa протактиний 231.04|U уран 238.03|Np нептуний [237]|Pu плутоний [244]|Am америций [243]|Cm кюрий [247]|Bk берклий [247]|Cf калифорний [251]|Es эйнштейний [252]|Fm фермий [257]|
Md менделевий [258]|No нобелий [259]|Lr лоуренсий [262]|Rf резерфордий [267]|Db дубний [268]|Sg сиборгий [269]|Bh борий [270]|Hs хассий [269]|Mt мейтнерий [278]|Ds дармштадтий [281]|
Rg рентгений [282]|Cn коперниций [285]|Nh нихоний [286]|Fl флеровий [289]|Mc московий [290]|Lv ливерморий [293]|Ts теннессин [294]|Og оганесон [294]`;

  // Обычные степени окисления в соединениях. У элементов из бота — как в боте, иногда шире (Au +1, Br +3 и +7).
  const STATES = {
    1: "+1 −1", 3: "+1", 4: "+2", 5: "+3", 6: "−4 +2 +4", 7: "−3 +1 +2 +3 +4 +5", 8: "−2", 9: "−1", 11: "+1", 12: "+2", 13: "+3",
    14: "−4 +4", 15: "−3 +3 +5", 16: "−2 +4 +6", 17: "−1 +1 +3 +5 +7", 19: "+1", 20: "+2", 21: "+3", 22: "+2 +3 +4", 23: "+2 +3 +4 +5",
    24: "+2 +3 +6", 25: "+2 +4 +6 +7", 26: "+2 +3", 27: "+2 +3", 28: "+2 +3", 29: "+1 +2", 30: "+2", 31: "+3", 32: "+2 +4", 33: "−3 +3 +5",
    34: "−2 +4 +6", 35: "−1 +1 +3 +5 +7", 36: "+2", 37: "+1", 38: "+2", 39: "+3", 40: "+4", 41: "+3 +5", 42: "+4 +6", 43: "+4 +7",
    44: "+3 +4 +8", 45: "+3", 46: "+2 +4", 47: "+1", 48: "+2", 49: "+3", 50: "+2 +4", 51: "−3 +3 +5", 52: "−2 +4 +6", 53: "−1 +1 +5 +7",
    54: "+2 +4 +6 +8", 55: "+1", 56: "+2", 57: "+3", 58: "+3 +4", 63: "+2 +3", 70: "+2 +3", 72: "+4", 73: "+5", 74: "+4 +6", 75: "+4 +7",
    76: "+4 +8", 77: "+3 +4", 78: "+2 +4", 79: "+1 +3", 80: "+1 +2", 81: "+1 +3", 82: "+2 +4", 83: "+3 +5", 84: "+2 +4", 85: "−1 +1",
    86: "+2", 87: "+1", 88: "+2", 89: "+3", 90: "+4", 91: "+5", 92: "+3 +4 +6", 93: "+5", 94: "+4", 95: "+3",
  };
  for (const z of [59, 60, 61, 62, 64, 65, 66, 67, 68, 69, 71, 96, 97, 98, 99, 100, 101, 103]) STATES[z] = "+3";
  STATES[102] = "+2 +3";

  const NONMETALS = new Set([1, 2, 5, 6, 7, 8, 9, 10, 14, 15, 16, 17, 18, 33, 34, 35, 36, 52, 53, 54, 85, 86, 117, 118]);
  const NOBLE = new Set([2, 10, 18, 36, 54, 86, 118]);
  const SHORT = ["", "I A", "II A", "III B", "IV B", "V B", "VI B", "VII B", "VIII B", "VIII B", "VIII B", "I B", "II B",
    "III A", "IV A", "V A", "VI A", "VII A", "VIII A"];
  const ORBITALS = ["1s", "2s", "2p", "3s", "3p", "4s", "3d", "4p", "5s", "4d", "5p", "6s", "4f", "5d", "6p", "7s", "5f", "6d", "7p"];
  const CAP = { s: 2, p: 6, d: 10, f: 14 };
  // Исключения из порядка заполнения: электрон «проваливается» на соседний подуровень
  const EXCEPT = {
    24: { "4s": -1, "3d": 1 }, 29: { "4s": -1, "3d": 1 }, 41: { "5s": -1, "4d": 1 }, 42: { "5s": -1, "4d": 1 }, 44: { "5s": -1, "4d": 1 },
    45: { "5s": -1, "4d": 1 }, 46: { "5s": -2, "4d": 2 }, 47: { "5s": -1, "4d": 1 }, 57: { "4f": -1, "5d": 1 }, 58: { "4f": -1, "5d": 1 },
    64: { "4f": -1, "5d": 1 }, 78: { "6s": -1, "5d": 1 }, 79: { "6s": -1, "5d": 1 }, 89: { "5f": -1, "6d": 1 }, 90: { "5f": -2, "6d": 2 },
    91: { "5f": -1, "6d": 1 }, 92: { "5f": -1, "6d": 1 }, 93: { "5f": -1, "6d": 1 }, 96: { "5f": -1, "6d": 1 },
  };

  function place(z) {
    if (z === 1) return { period: 1, group: 1 };
    if (z === 2) return { period: 1, group: 18 };
    for (const [period, start] of [[2, 3], [3, 11]]) {
      if (z < start + 8) { const i = z - start; return { period, group: i < 2 ? i + 1 : i + 11 }; }
    }
    if (z <= 36) return { period: 4, group: z - 18 };
    if (z <= 54) return { period: 5, group: z - 36 };
    const period = z <= 86 ? 6 : 7, i = z - (period === 6 ? 55 : 87);
    if (i < 2) return { period, group: i + 1 };
    if (i <= 16) return { period, group: 3, f: i - 2 };  // лантаноиды и актиноиды — отдельной строкой
    return { period, group: i - 13 };
  }

  function configuration(z) {
    const out = {};
    let left = z;
    for (const o of ORBITALS) {
      if (left <= 0) break;
      out[o] = Math.min(left, CAP[o[1]]);
      left -= out[o];
    }
    for (const [o, d] of Object.entries(EXCEPT[z] || {})) out[o] = (out[o] || 0) + d;
    return out;
  }
  const SUPS = n => String(n).replace(/\d/g, d => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]);
  function configText(z) {
    const c = configuration(z);
    return Object.keys(c).filter(o => c[o]).sort((a, b) => a[0] - b[0] || "spdf".indexOf(a[1]) - "spdf".indexOf(b[1]))
      .map(o => o + SUPS(c[o])).join(" ");
  }
  function levels(z) {
    const c = configuration(z), out = [];
    for (const [o, n] of Object.entries(c)) out[o[0] - 1] = (out[o[0] - 1] || 0) + n;
    return Array.from(out, x => x || 0);
  }

  const ELEMENTS = RAW.replace(/\n/g, "").split("|").map((s, i) => {
    const [symbol, name, mass] = s.trim().split(" ");
    const z = i + 1, pos = place(z), radioactive = mass.startsWith("[");
    const exact = radioactive ? parseInt(mass.slice(1), 10) : parseFloat(mass);
    const school = z === 17 ? 35.5 : Math.round(exact);  // как на ОГЭ и ЕГЭ
    const block = pos.f !== undefined ? "f" : z === 2 || pos.group <= 2 ? "s" : pos.group >= 13 ? "p" : "d";
    return { z, symbol, name, exact, school, radioactive, ...pos, block, metal: !NONMETALS.has(z), noble: NOBLE.has(z), states: STATES[z] || "" };
  });
  const BY_Z = Object.fromEntries(ELEMENTS.map(e => [e.z, e]));
  const num = x => String(x).replace(".", ",");

  const CSS = `
.pt { display: grid; gap: 10px; min-width: 0; }
.pt-search { font: 400 16px var(--body, system-ui); padding: 9px 12px; border: 1px solid var(--line); border-radius: 6px; background: var(--sheet); color: var(--ink); width: 100%; }
.pt-card { background: var(--sheet); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; display: grid; gap: 6px; font-size: 14px; line-height: 1.45; }
.pt-card .pt-head { display: flex; gap: 12px; align-items: center; }
.pt-card .pt-sym { font: 700 30px/1 var(--mono, monospace); min-width: 2.2ch; }
.pt-card .pt-name { font-weight: 600; font-size: 17px; }
.pt-card .pt-muted { color: var(--muted); }
.pt-card dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; }
.pt-card dt { color: var(--muted); }
.pt-card dd { margin: 0; overflow-wrap: anywhere; }
.pt-card .pt-mono { font-family: var(--mono, monospace); }
.pt-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.pt-actions button { font: 600 14px var(--body, system-ui); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--accent); background: transparent; color: var(--accent); cursor: pointer; }
.pt-scroll { overflow: auto; -webkit-overflow-scrolling: touch; border: 1px solid var(--line); border-radius: 8px; background: var(--sheet); padding: 6px; }
.pt-grid { display: grid; grid-template-columns: 18px repeat(18, 40px); grid-auto-rows: 46px; gap: 2px; width: max-content; }
.pt-grid .pt-lbl { font: 500 10px/1.1 var(--body, system-ui); color: var(--muted); display: grid; place-items: center; text-align: center; }
.pt-grid .pt-top { align-self: end; padding-bottom: 2px; height: 26px; }
.pt-el { border: 1px solid transparent; border-radius: 4px; padding: 2px 0 0; display: grid; grid-template-rows: auto 1fr auto; justify-items: center;
  color: #14304d; cursor: pointer; font-family: var(--body, system-ui); min-width: 0; }
.pt-el small { font-size: 9px; line-height: 1; justify-self: start; padding-left: 3px; }
.pt-el b { font: 700 15px/1 var(--mono, monospace); align-self: center; }
.pt-el i { font: 400 9px/1.2 var(--mono, monospace); font-style: normal; }
.pt-el.s { background: #f9d6d5; } .pt-el.p { background: #fbeab0; } .pt-el.d { background: #cfe3f7; } .pt-el.f { background: #d3eccd; }
.pt-el.dim { opacity: .25; }
.pt-el.on { border-color: #14304d; box-shadow: 0 0 0 2px var(--accent); }
.pt-el.gap { background: var(--paper); color: var(--muted); border: 1px dashed var(--line); font-size: 9px; text-align: center; place-items: center; display: grid; grid-template-rows: none; }
.pt-legend { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; color: var(--muted); }
.pt-legend span::before { content: ""; display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 4px; vertical-align: -1px; background: var(--c); }
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

  function card(e, opts) {
    if (!e) return el("div", { class: "pt-card" }, el("p", { class: "pt-muted", style: "margin:0" },
      "Нажми на элемент: покажу массу, строение атома и степени окисления. Цвет клетки — какой подуровень заполняется: s, p, d или f."));
    const lv = levels(e.z);
    const n = e.school === 35.5 ? null : Math.round(e.school) - e.z;
    const kind = e.noble ? "благородный газ" : e.metal ? "металл" : "неметалл";
    const group = e.f !== undefined ? `III B, ${e.period === 6 ? "лантаноид" : "актиноид"}`
      : `${SHORT[e.group]} (${e.group}-я в длинной таблице), ${SHORT[e.group].endsWith("A") ? "главная" : "побочная"} подгруппа`;
    const mass = e.radioactive ? `${e.exact} — массовое число самого устойчивого изотопа`
      : e.z === 17 ? "35,5 в задачах (точнее 35,45: смесь изотопов ³⁵Cl и ³⁷Cl)"
      : `${num(e.school)} в задачах (точнее ${num(e.exact)})`;
    const rows = [
      ["Ar", mass], ["Место", `${e.period}-й период, группа ${group}`], ["Вид", `${kind}, ${e.block}-элемент${e.radioactive ? ", радиоактивный" : ""}`],
      ["Атом", n === null ? `${e.z} протонов, ${e.z} электронов, нейтронов 18 или 20` : `${e.z} протонов, ${e.z} электронов, ${n} нейтронов (A − Z = ${Math.round(e.school)} − ${e.z})`],
      ["Уровни", `${lv.join(", ")} — ${lv.length} ${lv.length === 1 ? "уровень" : lv.length < 5 ? "уровня" : "уровней"}, на внешнем ${lv[lv.length - 1]}`],
      ["Формула", el("span", { class: "pt-mono" }, configText(e.z) + (e.z > 103 ? " (расчёт по правилу, опытом не проверено)" : ""))],
      ["Степени", e.states || (e.noble ? "соединений почти не образует" : "в школьном курсе не встречается")],
    ];
    const actions = [];
    if (opts.onUse) actions.push(el("button", { type: "button", onclick: () => opts.onUse(e.school, e) }, `➕ ${num(e.school)} в калькулятор`));
    if (opts.onBuild && e.z <= 20) actions.push(el("button", { type: "button", onclick: () => opts.onBuild(e) }, "⚛️ Собрать этот атом"));
    return el("div", { class: "pt-card", "aria-live": "polite" },
      el("div", { class: "pt-head" }, el("span", { class: "pt-sym" }, e.symbol),
        el("div", {}, el("div", { class: "pt-name" }, e.name[0].toUpperCase() + e.name.slice(1)), el("div", { class: "pt-muted" }, `порядковый номер ${e.z}`))),
      el("dl", {}, rows.map(([k, v]) => [el("dt", {}, k), el("dd", {}, v)])),
      actions.length ? el("div", { class: "pt-actions" }, actions) : null);
  }

  function mount(root, opts = {}) {
    if (!document.getElementById("pt-style")) document.head.append(el("style", { id: "pt-style" }, CSS));
    let chosen = BY_Z[opts.selected] || null;
    const cardBox = el("div");
    const grid = el("div", { class: "pt-grid", role: "grid", "aria-label": "Периодическая система" });
    const cells = {};
    const at = (row, col, node) => { node.style.gridRow = row; node.style.gridColumn = col; grid.append(node); };
    for (let g = 1; g <= 18; g++) at(1, g + 1, el("div", { class: "pt-lbl pt-top" }, String(g), el("br"), SHORT[g].replace(" ", "")));
    for (let p = 1; p <= 7; p++) at(p + 1, 1, el("div", { class: "pt-lbl" }, String(p)));
    for (const e of ELEMENTS) {
      const node = el("button", { type: "button", class: `pt-el ${e.block}`, title: `${e.name}, ${e.z}`, "aria-label": `${e.name}, номер ${e.z}`,
        onclick: () => choose(e) }, el("small", {}, String(e.z)), el("b", {}, e.symbol), el("i", {}, e.radioactive ? `[${e.exact}]` : num(e.school)));
      cells[e.z] = node;
      if (e.f !== undefined) at(e.period === 6 ? 10 : 11, e.f + 4, node);
      else at(e.period + 1, e.group + 1, node);
    }
    at(7, 4, el("div", { class: "pt-el gap" }, "57–71"));
    at(8, 4, el("div", { class: "pt-el gap" }, "89–103"));
    at(10, "1 / span 3", el("div", { class: "pt-lbl" }, "лантаноиды"));
    at(11, "1 / span 3", el("div", { class: "pt-lbl" }, "актиноиды"));
    grid.style.gridTemplateRows = "26px repeat(7, 46px) 10px 46px 46px";

    const search = el("input", { class: "pt-search", type: "search", placeholder: "Найти: Fe, железо или 26", "aria-label": "Найти элемент" });
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      const hits = ELEMENTS.filter(e => q && (e.symbol.toLowerCase() === q || e.name.startsWith(q) || String(e.z) === q));
      for (const e of ELEMENTS) cells[e.z].classList.toggle("dim", Boolean(q) && !hits.includes(e));
      const exact = hits.find(e => e.symbol.toLowerCase() === q || e.name === q || String(e.z) === q) || (hits.length === 1 ? hits[0] : null);
      if (exact) choose(exact, true);
    });

    function choose(e, fromSearch) {
      if (chosen) cells[chosen.z].classList.remove("on");
      chosen = e;
      cells[e.z].classList.add("on");
      cardBox.replaceChildren(card(e, opts));
      if (fromSearch) cells[e.z].scrollIntoView({ block: "nearest", inline: "center" });
      opts.onSelect?.(e);
    }

    const legend = el("div", { class: "pt-legend" },
      [["s", "#f9d6d5"], ["p", "#fbeab0"], ["d", "#cfe3f7"], ["f", "#d3eccd"]].map(([b, c]) => el("span", { style: `--c:${c}` }, `${b}-элементы`)),
      el("span", { style: "--c:transparent" }, "под знаком — Ar для задач"));
    root.replaceChildren(el("div", { class: "pt" }, search, cardBox, el("div", { class: "pt-scroll" }, grid), legend));
    if (chosen) choose(chosen); else cardBox.replaceChildren(card(null, opts));
    return { choose: z => BY_Z[z] && choose(BY_Z[z], true) };
  }

  window.PTable = { ELEMENTS, BY_Z, mount, configuration, levels };
})();
