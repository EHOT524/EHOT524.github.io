// Опыт за игры на сайте уходит в бота ссылкой t.me/…?start=g_…: сервер бота из России напрямую не открывается,
// а игры запускаются кнопкой под сообщением, откуда Telegram не даёт отправить данные боту иначе.
// Заработанное копится в браузере, пока ученик не нажмёт «Забрать опыт». Сколько XP дать и дневной предел решает бот
// (app/handlers/user.py, GAMES). Подпись защищает только от подбора ссылки руками: страница открытая.
const BotXP = (() => {
  const BOT = "NewtonPhys_bot", KEY = "botxp:pending", SALT = "apple-falls-9.8";
  const LETTER = { phys: "p", math: "m", info: "i", chem: "c" };

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
  function save(all) { try { localStorage.setItem(KEY, JSON.stringify(all)); } catch {} }
  function hash(text) {  // FNV-1a, тот же расчёт в боте
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(36);
  }
  function newId() { return Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36).padStart(2, "0"); }

  /** Запомнить n верных ответов игры game ("b", "j", "k", "g") по предмету. */
  function add(game, subject, n) {
    if (!(n > 0) || !LETTER[subject]) return;
    const all = load(), slot = game + LETTER[subject], old = all[slot] || { n: 0, id: newId() };
    all[slot] = { n: Math.min(999, old.n + n), id: old.id };
    save(all);
  }
  function pending(game, subject) { return (load()[game + LETTER[subject]] || {}).n || 0; }

  function claim(game, subject) {
    const all = load(), slot = game + LETTER[subject], p = all[slot];
    if (!p) return;
    const body = `g_${slot}_${p.n}_${p.id}`, path = `/${BOT}?start=${body}_${hash(body + SALT)}`;
    delete all[slot];
    save(all);
    try {
      if (window.TelegramWebviewProxy) return window.TelegramWebviewProxy.postEvent("web_app_open_tg_link", JSON.stringify({ path_full: path }));
      if (window.parent !== window) return window.parent.postMessage(JSON.stringify({ eventType: "web_app_open_tg_link", eventData: { path_full: path } }), "*");
    } catch {}
    location.href = "https://t.me" + path;
  }

  /** Кнопка «Забрать опыт»: видна, только когда есть что забирать. */
  function button(el, game, subject) {
    const n = pending(game, subject);
    el.hidden = !n;
    el.disabled = false;
    el.textContent = "🍎 Забрать опыт в боте";
    el.onclick = () => { el.disabled = true; el.textContent = "Открываю бота…"; claim(game, subject); };
  }

  return { add, pending, claim, button, hash };
})();
