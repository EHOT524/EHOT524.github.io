// Робот для задания 15 ОГЭ. Школьный алгоритмический язык переводится в Python, поэтому исполнитель и проверка одни на оба языка.
const SIDES = { справа: "справа_свободно()", слева: "слева_свободно()", сверху: "сверху_свободно()", снизу: "снизу_свободно()" };
const MOVES = new Set(["вправо", "влево", "вверх", "вниз", "закрасить"]);

function words(source) {
  const list = [];
  source.split("\n").forEach((text, i) => {
    for (const m of text.split("|")[0].matchAll(/[а-яёa-z0-9_]+|[();]|\S/gi)) list.push({ word: m[0].toLowerCase().replaceAll("ё", "е"), line: i + 1 });
    list.push({ word: "\n", line: i + 1 });
  });
  return list;
}

function translate(source) {
  const list = words(source), out = [];
  let at = 0, depth = 0;
  const fail = (item, text) => { throw new Error(`Ошибка в строке ${item.line}: ${text}`); };
  const peek = () => list[at] || { word: "", line: list.length ? list.at(-1).line : 1 };
  const emit = text => out.push("    ".repeat(depth) + text);
  const skipLines = () => { while (peek().word === "\n" || peek().word === ";") at++; };

  function condition(stops) {  // условие проверяется по шагам, чтобы ошибка называла строку ученика, а не строку перевода
    const parts = [];
    let operand = true, open = 0;
    while (peek().word && !stops.includes(peek().word)) {
      const item = list[at++], w = item.word;
      if (operand) {
        if (w === "не") parts.push("not");
        else if (w === "(") { parts.push("("); open++; }
        else if (SIDES[w]) {
          const state = list[at++]?.word;
          if (state === "свободно") parts.push(SIDES[w]);
          else if (state === "стена") parts.push(`(not ${SIDES[w]})`);
          else fail(item, `после «${w}» нужно слово «свободно» или «стена».`);
          operand = false;
        } else if (w === "клетка") {
          const state = list[at++]?.word;
          if (state === "закрашена") parts.push("клетка_закрашена()");
          else if (state === "чистая") parts.push("(not клетка_закрашена())");
          else fail(item, "после «клетка» нужно слово «закрашена» или «чистая».");
          operand = false;
        } else fail(item, `в условии не понимаю «${w}».`);
      } else if (w === "и") { parts.push("and"); operand = true; }
      else if (w === "или") { parts.push("or"); operand = true; }
      else if (w === ")" && open) { parts.push(")"); open--; }
      else fail(item, `в условии не понимаю «${w}».`);
    }
    if (operand || open) fail(peek(), "условие не закончено или не закрыта скобка.");
    return parts.join(" ");
  }

  function block(stops) {
    emit("pass");
    while (true) {
      skipLines();
      const item = peek(), w = item.word;
      if (!w) {
        if (stops.length) fail(item, `не хватает слова «${stops.at(-1)}».`);
        return "";
      }
      if (stops.includes(w)) { at++; return w; }
      at++;
      if (w === "алг") { while (peek().word !== "\n" && peek().word) at++; }
      else if (w === "нач") continue;
      else if (w === "кон") { if (stops.length) fail(item, "цикл или условие не закрыто до слова «кон»."); return ""; }
      else if (w === "нц") {
        if (peek().word === "пока") {
          at++;
          emit(`while ${condition(["\n", ";"])}:`);
        } else if (/^\d+$/.test(peek().word) && list[at + 1]?.word === "раз") {
          emit(`for _ in range(${peek().word}):`);
          at += 2;
        } else fail(item, "после «нц» нужно «пока условие» или «число раз».");
        depth++;
        block(["кц"]);
        depth--;
      } else if (w === "если") {
        emit(`if ${condition(["то"])}:`);
        if (peek().word !== "то") fail(item, "в условии нет слова «то».");
        at++;
        depth++;
        const end = block(["иначе", "все"]);
        depth--;
        if (end === "иначе") {
          emit("else:");
          depth++;
          block(["все"]);
          depth--;
        }
      } else if (MOVES.has(w)) emit(`${w}()`);
      else fail(item, `не понимаю «${w}». Робот знает команды движения, «закрасить», циклы и условия.`);
    }
  }

  block([]);
  return out.join("\n") + "\n";
}

const field = (w, h, x, y) => ({ w, h, x, y, top: [], left: [], target: [] });
const wallAbove = (f, x, y) => f.top.push(`${x},${y}`);  // стена над клеткой
const wallLeft = (f, x, y) => f.left.push(`${x},${y}`);  // стена слева от клетки
const paintIt = (f, x, y) => f.target.push(`${x},${y}`);
const flags = (r, n, chance) => many(n, () => r() < chance);

const ROBOT_HELP = "Команды: вправо, влево, вверх, вниз, закрасить. Условия: справа свободно, слева свободно, сверху свободно, снизу свободно. Если Робот пойдёт в стену, он разобьётся. Алгоритм должен работать для любых размеров, которые разрешает условие.";

function robot(id, title, text, hint, algo, python, fields) {
  return { id, no: 15, kind: "robot", title, text: `${text} ${ROBOT_HELP}`, hint, model: { algo, python }, limit: 10, fields,
    start: { algo: "алг\nнач\n\nкон\n", python: "# вправо()  закрасить()  справа_свободно()\n\n" } };
}

const ROBOT_TASKS = [
  robot("r1", "Вдоль стены", "Над Роботом горизонтальная стена, он стоит под её левым концом. Длина стены неизвестна, правее конца стены свободно. Закрась все клетки непосредственно под стеной.",
    "Пока сверху стена, закрашивай клетку и шагай вправо.",
    `алг
нач
  нц пока сверху стена
    закрасить
    вправо
  кц
кон
`, `while not сверху_свободно():
    закрасить()
    вправо()
`, r => [1, 2, 5, rand(r, 3, 12), rand(r, 3, 12), rand(r, 3, 12)].map(n => {
      const f = field(n + 4, 5, 1, 2);
      for (let i = 0; i < n; i++) { wallAbove(f, 1 + i, 2); paintIt(f, 1 + i, 2); }
      return f;
    })),
  robot("r2", "Стена с проходом", "Робот стоит под левым концом горизонтальной стены. В стене есть один проход, его место и ширина неизвестны, но проход не бывает в первой и последней клетке стены. Закрась все клетки под стеной. Клетки под проходом должны остаться чистыми.",
    "Здесь три цикла подряд: до прохода, через проход и после него.",
    `алг
нач
  нц пока сверху стена
    закрасить
    вправо
  кц
  нц пока сверху свободно
    вправо
  кц
  нц пока сверху стена
    закрасить
    вправо
  кц
кон
`, `while not сверху_свободно():
    закрасить()
    вправо()
while сверху_свободно():
    вправо()
while not сверху_свободно():
    закрасить()
    вправо()
`, r => [[1, 1, 1], [3, 1, 1], [1, 4, 2], [rand(r, 2, 6), rand(r, 1, 4), rand(r, 2, 6)], [rand(r, 2, 6), rand(r, 1, 4), rand(r, 2, 6)]].map(([a, g, b]) => {
      const f = field(a + g + b + 4, 5, 1, 2);
      for (let i = 0; i < a + g + b; i++) if (i < a || i >= a + g) { wallAbove(f, 1 + i, 2); paintIt(f, 1 + i, 2); }
      return f;
    })),
  robot("r3", "Угол", "Правый конец горизонтальной стены соединён с верхним концом вертикальной. Робот стоит под левым концом горизонтальной стены. Длины стен неизвестны. Закрась все клетки под горизонтальной стеной и слева от вертикальной. Угловая клетка тоже закрашивается.",
    "Сначала иди вправо, пока не упрёшься. Потом иди вниз, пока справа есть стена.",
    `алг
нач
  нц пока справа свободно
    закрасить
    вправо
  кц
  нц пока справа стена
    закрасить
    вниз
  кц
кон
`, `while справа_свободно():
    закрасить()
    вправо()
while not справа_свободно():
    закрасить()
    вниз()
`, r => [[1, 1], [1, 4], [5, 1], [rand(r, 2, 10), rand(r, 2, 8)], [rand(r, 2, 10), rand(r, 2, 8)]].map(([a, b]) => {
      const f = field(a + 3, b + 4, 1, 1);
      for (let i = 0; i < a; i++) { wallAbove(f, 1 + i, 1); paintIt(f, 1 + i, 1); }
      for (let i = 0; i < b; i++) { wallLeft(f, 1 + a, 1 + i); paintIt(f, a, 1 + i); }
      return f;
    })),
  robot("r4", "Угол с проходами", "Нижний конец вертикальной стены соединён с левым концом горизонтальной. Робот стоит справа от верхнего конца вертикальной стены. В каждой стене есть один проход неизвестной ширины, он не бывает в клетках на концах стены. Закрась все клетки справа от вертикальной стены и над горизонтальной. Клетки у проходов должны остаться чистыми.",
    "Спускайся вниз до угла в три цикла, а затем так же иди вправо вдоль пола.",
    `алг
нач
  нц пока слева стена
    закрасить
    вниз
  кц
  нц пока слева свободно
    вниз
  кц
  нц пока снизу свободно
    закрасить
    вниз
  кц
  нц пока снизу стена
    закрасить
    вправо
  кц
  нц пока снизу свободно
    вправо
  кц
  нц пока снизу стена
    закрасить
    вправо
  кц
кон
`, `while not слева_свободно():
    закрасить()
    вниз()
while слева_свободно():
    вниз()
while снизу_свободно():
    закрасить()
    вниз()
while not снизу_свободно():
    закрасить()
    вправо()
while снизу_свободно():
    вправо()
while not снизу_свободно():
    закрасить()
    вправо()
`, r => [[1, 1, 1, 1, 1, 1], [2, 1, 3, 1, 2, 2], [rand(r, 1, 4), rand(r, 1, 3), rand(r, 1, 4), rand(r, 1, 5), rand(r, 1, 3), rand(r, 1, 5)], [rand(r, 1, 4), rand(r, 1, 3), rand(r, 1, 4), rand(r, 1, 5), rand(r, 1, 3), rand(r, 1, 5)]].map(([a, g, b, c, k, d]) => {
      const rows = a + g + b, cols = c + k + d, f = field(cols + 5, rows + 4, 2, 1);
      for (let i = 0; i < rows; i++) if (i < a || i >= a + g) { wallLeft(f, 2, 1 + i); paintIt(f, 2, 1 + i); }
      for (let i = 0; i < cols; i++) if (i < c || i >= c + k) { wallAbove(f, 2 + i, 1 + rows); paintIt(f, 2 + i, rows); }
      return f;
    })),
  robot("r5", "Коридор", "Робот стоит в левом конце горизонтального коридора шириной в одну клетку. Коридор заканчивается вертикальной стеной справа. В верхней и нижней стенах коридора есть проходы. Закрась только те клетки коридора, у которых стена есть и сверху, и снизу.",
    "Иди вправо, пока свободно, а внутри цикла проверяй обе стены. Последнюю клетку проверь после цикла.",
    `алг
нач
  нц пока справа свободно
    если сверху стена и снизу стена то
      закрасить
    все
    вправо
  кц
  если сверху стена и снизу стена то
    закрасить
  все
кон
`, `while справа_свободно():
    if not сверху_свободно() and not снизу_свободно():
        закрасить()
    вправо()
if not сверху_свободно() and not снизу_свободно():
    закрасить()
`, r => [1, 2, 6, rand(r, 5, 13), rand(r, 5, 13), rand(r, 5, 13)].map(n => {
      const f = field(n + 3, 5, 1, 2), up = flags(r, n, 0.7), low = flags(r, n, 0.7);
      for (let i = 0; i < n; i++) {
        if (up[i]) wallAbove(f, 1 + i, 2);
        if (low[i]) wallAbove(f, 1 + i, 3);
        if (up[i] && low[i]) paintIt(f, 1 + i, 2);
      }
      wallLeft(f, 1 + n, 2);
      return f;
    })),
  robot("r6", "До пола", "Робот стоит в верхней клетке столбца. Снизу столбец заканчивается горизонтальной стеной. Слева от столбца идёт вертикальная стена с несколькими проходами. Высота столбца неизвестна. Закрась только те клетки столбца, у которых слева стена.",
    "Иди вниз, пока свободно, а внутри цикла проверяй стену слева. Нижнюю клетку проверь после цикла.",
    `алг
нач
  нц пока снизу свободно
    если слева стена то
      закрасить
    все
    вниз
  кц
  если слева стена то
    закрасить
  все
кон
`, `while снизу_свободно():
    if not слева_свободно():
        закрасить()
    вниз()
if not слева_свободно():
    закрасить()
`, r => [1, 2, 5, rand(r, 4, 11), rand(r, 4, 11), rand(r, 4, 11)].map(n => {
      const f = field(5, n + 3, 2, 1), wall = flags(r, n, 0.65);
      for (let i = 0; i < n; i++) if (wall[i]) { wallLeft(f, 2, 1 + i); paintIt(f, 2, 1 + i); }
      wallAbove(f, 2, 1 + n);
      return f;
    })),
];
TASKS.oge.unshift(...ROBOT_TASKS);

function drawField(canvas, f, state) {
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const width = canvas.clientWidth || 600, size = Math.min(width / f.w, 34), ratio = devicePixelRatio || 1;
  canvas.style.height = `${size * f.h}px`;
  canvas.width = width * ratio;
  canvas.height = size * f.h * ratio;
  const c = canvas.getContext("2d");
  c.scale(ratio, ratio);
  const px = x => (width - size * f.w) / 2 + x * size, py = y => y * size;
  c.fillStyle = css("--good");
  c.globalAlpha = 0.28;
  for (const cell of state.painted) { const [x, y] = cell.split(",").map(Number); c.fillRect(px(x), py(y), size, size); }
  c.globalAlpha = 1;
  c.strokeStyle = css("--line");
  c.lineWidth = 1;
  c.beginPath();
  for (let x = 0; x <= f.w; x++) { c.moveTo(px(x), 0); c.lineTo(px(x), size * f.h); }
  for (let y = 0; y <= f.h; y++) { c.moveTo(px(0), py(y)); c.lineTo(px(f.w), py(y)); }
  c.stroke();
  c.fillStyle = css("--muted");
  for (const cell of f.target) {
    const [x, y] = cell.split(",").map(Number);
    c.beginPath();
    c.arc(px(x) + size / 2, py(y) + size / 2, Math.max(2, size / 9), 0, 7);
    c.fill();
  }
  c.strokeStyle = css("--ink");
  c.lineWidth = 3;
  c.lineCap = "round";
  c.beginPath();
  for (const wall of f.top) { const [x, y] = wall.split(",").map(Number); c.moveTo(px(x), py(y)); c.lineTo(px(x + 1), py(y)); }
  for (const wall of f.left) { const [x, y] = wall.split(",").map(Number); c.moveTo(px(x), py(y)); c.lineTo(px(x), py(y + 1)); }
  c.stroke();
  c.fillStyle = state.crashed ? css("--hit") : css("--accent");
  c.beginPath();
  c.arc(px(state.x) + size / 2, py(state.y) + size / 2, size * 0.36, 0, 7);
  c.fill();
  c.fillStyle = css("--accent-ink");
  c.font = `600 ${Math.round(size * 0.46)}px system-ui, sans-serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("Р", px(state.x) + size / 2, py(state.y) + size / 2 + 1);
}

const fresh = f => ({ x: f.x, y: f.y, painted: new Set() });
function stepRobot(state, move) {
  if (move === "r") state.x++;
  if (move === "l") state.x--;
  if (move === "u") state.y--;
  if (move === "d") state.y++;
  if (move === "p") state.painted.add(`${state.x},${state.y}`);
}
