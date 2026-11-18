// Общие мелочи новых игр: связь с Telegram, предмет и режим из адреса, рекорды, переключение экранов.
"use strict";
const Kit = (() => {
  function telegram(event, data = {}) {
    try {
      if (window.TelegramWebviewProxy) window.TelegramWebviewProxy.postEvent(event, JSON.stringify(data));
      else if (window.parent !== window) window.parent.postMessage(JSON.stringify({ eventType: event, eventData: data }), "*");
    } catch {}
  }
  telegram("web_app_ready");
  telegram("web_app_expand");

  const params = new URLSearchParams(location.search);
  const subject = ["phys", "math", "info", "chem"].includes(params.get("s")) ? params.get("s") : "phys";
  const mode = params.get("mode");
  const MODE_GRADE = { 7: 7, 8: 8, 9: 9, 10: 10, 11: 11, oge: 9, ege: 11, ege_base: 11 };
  const grade = MODE_GRADE[mode] ?? 11;

  const $ = id => document.getElementById(id);
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const shuffle = list => { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
  const num = (x, digits = 2) => (Math.round(x * 10 ** digits) / 10 ** digits).toString().replace(".", ",").replace("-", "−");
  function plural(n, one, few, many) {
    const a = n % 10, b = n % 100;
    return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
  }

  // Рекорд хранится в браузере по игре и предмету
  function best(game, slot = subject) { try { return (JSON.parse(localStorage.getItem(game + ":best")) || {})[slot] || 0; } catch { return 0; } }
  function saveBest(game, score, slot = subject) {
    if (score <= best(game, slot)) return false;
    try { localStorage.setItem(game + ":best", JSON.stringify({ ...(JSON.parse(localStorage.getItem(game + ":best")) || {}), [slot]: score })); } catch {}
    return true;
  }

  function show(id, all = ["home", "game", "over"]) {
    for (const x of all) $(x).hidden = x !== id;
    scrollTo(0, 0);
  }

  // Справочник бота (ref-<предмет>.js): термины, формулы, тривиальные названия только для режима ученика
  function loadRef(onload, onerror) {
    const s = document.createElement("script");
    s.src = `ref-${subject}.js`;
    s.onload = () => {
      const data = REF_DATA, ok = x => !mode || !data.modes[mode] || x.m.includes(mode);
      onload({ terms: data.terms.filter(ok), formulas: data.formulas.filter(ok), trivial: (data.trivial || []).filter(t => t.g <= grade) });
    };
    s.onerror = onerror;
    document.head.append(s);
  }

  function list(el, items) {
    el.replaceChildren(...items.map(text => { const li = document.createElement("li"); li.textContent = text; return li; }));
  }

  return { telegram, subject, mode, grade, $, pick, shuffle, cap, num, plural, best, saveBest, show, loadRef, list };
})();
