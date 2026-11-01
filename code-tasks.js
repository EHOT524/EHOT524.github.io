// Свои задания по типам демоверсий 2027. Проверка сравнивает вывод программы с ответом, посчитанным здесь же.
// tests(r) возвращает наборы данных. hidden прячет данные от ученика, потому что это большой файл или скрытая проверка.
const rng = seed => () => {  // числа зависят только от seed, поэтому у всех учеников одни и те же файлы
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rand = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const many = (n, make) => Array.from({ length: n }, make);
const numbers = (r, n, a, b) => many(n, () => rand(r, a, b));
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const digits = x => [...String(x)].reduce((s, d) => s + Number(d), 0);
const isPrime = x => { if (x < 2) return false; for (let d = 2; d * d <= x; d++) if (x % d === 0) return false; return true; };

const OGE_INPUT = "Программа получает на вход натуральные числа, каждое с новой строки. Их количество неизвестно, но не больше 1000, а сами числа не больше 30 000. Ввод заканчивается числом 0, оно в последовательность не входит.";
const OGE_START = `while True:
    x = int(input())
    if x == 0:
        break
    # что делать с числом x?

print()
`;

function oge(id, title, ask, sample, solve, model, hint, edges, make) {
  const stdin = list => [...list, 0].join("\n") + "\n";
  return {
    id, no: 16, title, text: `${ask} ${OGE_INPUT}`, hint, model, start: OGE_START, sample: { input: stdin(sample), output: String(solve(sample)) }, limit: 10,
    tests: r => [sample, ...edges, make(r, 30), make(r, 1000)].map((list, i) => ({
      label: `набор ${i + 1}`, input: stdin(list), out: String(solve(list)),
    })),
  };
}

const OGE_TASKS = [
  oge("o1", "Кратные и последняя цифра", "Напиши программу, которая считает, сколько чисел делится на 7 и оканчивается на цифру 3.",
    [63, 14, 133, 5], l => l.filter(x => x % 7 === 0 && x % 10 === 3).length,
    `count = 0
while True:
    x = int(input())
    if x == 0:
        break
    if x % 7 == 0 and x % 10 == 3:
        count += 1
print(count)
`, "Последняя цифра числа это остаток от деления на 10.", [[3], [63]], (r, n) => numbers(r, n, 1, 30000)),
  oge("o2", "Сумма двузначных чётных", "Напиши программу, которая находит сумму всех двузначных чётных чисел. Если таких чисел нет, она печатает 0.",
    [12, 7, 104, 50], l => l.filter(x => x >= 10 && x <= 99 && x % 2 === 0).reduce((s, x) => s + x, 0),
    `total = 0
while True:
    x = int(input())
    if x == 0:
        break
    if 10 <= x <= 99 and x % 2 == 0:
        total += x
print(total)
`, "Заведи сумму до цикла и прибавляй к ней только подходящие числа.", [[7], [10, 99, 98, 100]], (r, n) => numbers(r, n, 1, 300)),
  oge("o3", "Наибольшее кратное", "Напиши программу, которая находит наибольшее число, кратное 6. Такое число в последовательности всегда есть.",
    [12, 60, 61, 18], l => Math.max(...l.filter(x => x % 6 === 0)),
    `best = 0
while True:
    x = int(input())
    if x == 0:
        break
    if x % 6 == 0 and x > best:
        best = x
print(best)
`, "Запоминай лучшее число и обновляй его, только если новое кратно 6 и больше.", [[6], [30000, 29994, 29999]], (r, n) => [...numbers(r, n, 1, 30000), 6 * rand(r, 1, 5000)]),
  oge("o4", "Наименьшее с цифрой 4", "Напиши программу, которая находит наименьшее число, оканчивающееся на цифру 4. Такое число в последовательности всегда есть.",
    [24, 104, 9, 14], l => Math.min(...l.filter(x => x % 10 === 4)),
    `best = 30001
while True:
    x = int(input())
    if x == 0:
        break
    if x % 10 == 4 and x < best:
        best = x
print(best)
`, "Начальное значение минимума должно быть больше любого числа из условия.", [[4], [29994, 5, 30000]], (r, n) => [...numbers(r, n, 1, 30000), 10 * rand(r, 0, 2999) + 4]),
  oge("o5", "Шестнадцатеричная запись", "Напиши программу, которая считает числа, запись которых в шестнадцатеричной системе счисления трёхзначна и оканчивается на цифру 7.",
    [263, 7, 4087, 4103], l => l.filter(x => x >= 256 && x <= 4095 && x % 16 === 7).length,
    `count = 0
while True:
    x = int(input())
    if x == 0:
        break
    if 256 <= x <= 4095 and x % 16 == 7:
        count += 1
print(count)
`, "Трёхзначные числа в этой системе идут от 100₁₆ = 256 до FFF₁₆ = 4095. Последняя цифра равна остатку от деления на 16.", [[7], [255, 256, 263, 4087, 4095, 4103]], (r, n) => numbers(r, n, 1, 8000)),
  oge("o6", "Общий делитель", "Напиши программу, которая находит наибольший общий делитель всех чисел последовательности.",
    [36, 48, 60], l => l.reduce(gcd),
    `def gcd(a, b):
    while b != 0:
        a, b = b, a % b
    return a


result = 0
while True:
    x = int(input())
    if x == 0:
        break
    result = gcd(result, x)
print(result)
`, "Алгоритм Евклида: заменяй пару (a, b) на (b, a % b), пока b не станет нулём. НОД нескольких чисел считается по очереди.", [[17], [7, 13], [30000, 15000]],
    (r, n) => { const d = rand(r, 2, 60); return numbers(r, n, 1, Math.floor(30000 / d)).map(x => x * d); }),
  oge("o7", "Простые числа", "Напиши программу, которая считает простые числа. Простое число делится только на 1 и на себя, а 1 простым не считается.",
    [2, 9, 17, 1, 21], l => l.filter(isPrime).length,
    `def is_prime(n):
    if n < 2:
        return False
    d = 2
    while d * d <= n:
        if n % d == 0:
            return False
        d += 1
    return True


count = 0
while True:
    x = int(input())
    if x == 0:
        break
    if is_prime(x):
        count += 1
print(count)
`, "Делители достаточно искать до корня из числа. Отдельно проверь число 1.", [[1], [2], [4, 25, 49, 29989]], (r, n) => numbers(r, n, 1, 30000)),
  oge("o8", "Сумма цифр", "Напиши программу, которая находит число с наибольшей суммой цифр. Если таких чисел несколько, она печатает наименьшее из них.",
    [19, 91, 100, 28], l => l.reduce((b, x) => digits(x) > digits(b) || (digits(x) === digits(b) && x < b) ? x : b),
    `best = 0
best_sum = -1
while True:
    x = int(input())
    if x == 0:
        break
    s = sum(int(d) for d in str(x))
    if s > best_sum or (s == best_sum and x < best):
        best = x
        best_sum = s
print(best)
`, "Для каждого числа посчитай сумму цифр и сравни её с лучшей. При равенстве сравни сами числа.", [[5], [91, 19], [1000, 100, 10]], (r, n) => numbers(r, n, 1, 30000)),
];

const fileTask = (no, id, title, file, text, sample, model, hint, make, extra = {}) => ({
  id, no, title, text, hint, model, file, sample, limit: 60,
  start: `with open("${file}") as f:\n    data = f.read().split()\n\nprint()\n`,
  tests: make, ...extra,
});
const onFile = (file, text, out, label, hidden = true) => ({ label, files: { [file]: text }, out: String(out), hidden });

const longestAlternating = s => {
  let best = 1, run = 1;
  for (let i = 1; i < s.length; i++) { run = s[i] === s[i - 1] ? 1 : run + 1; best = Math.max(best, run); }
  return best;
};
const longestFewD = s => {
  let best = 0, left = 0, d = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "D") d++;
    while (d > 2) if (s[left++] === "D") d--;
    best = Math.max(best, i - left + 1);
  }
  return best;
};
const longestExpression = s => {
  let best = 0;
  for (const m of s.matchAll(/(?:0|[1-9][0-9]*)(?:[+*](?:0|[1-9][0-9]*))*/g)) best = Math.max(best, m[0].length);
  return best;
};
const letters = (r, n, abc) => many(n, () => abc[rand(r, 0, abc.length - 1)]).join("");

const packDisk = (space, sizes) => {
  const sorted = [...sizes].sort((a, b) => a - b);
  let used = 0, k = 0;
  while (k < sorted.length && used + sorted[k] <= space) used += sorted[k++];
  const rest = space - used + sorted[k - 1];
  return `${k} ${Math.max(...sorted.slice(k - 1).filter(x => x <= rest))}`;
};
const lastFreePair = (rows, seats, taken) => {
  const busy = new Set(taken.map(([a, b]) => a * 100000 + b));
  for (let a = rows; a >= 1; a--)
    for (let b = 1; b < seats; b++)
      if (!busy.has(a * 100000 + b) && !busy.has(a * 100000 + b + 1)) return `${a} ${b}`;
};
const meetings = list => {
  let count = 0, end = -1;
  for (const [a, b] of [...list].sort((p, q) => p[1] - q[1]))
    if (a >= end) { count++; end = b; }
  return `${count} ${end}`;
};
const pairsNotFive = pairs => {
  const total = pairs.reduce((s, [a, b]) => s + Math.max(a, b), 0);
  if (total % 5) return total;
  return total - pairs.reduce((least, [a, b]) => Math.abs(a - b) % 5 ? Math.min(least, Math.abs(a - b)) : least, Infinity);
};
const fivePairs = (r, n) => {  // сумма больших чисел кратна 5, иначе задача решалась бы без главной мысли
  const pairs = many(n, () => [rand(r, 1, 10000), rand(r, 1, 10000)]);
  pairs[0] = [rand(r, 9000, 10000), rand(r, 1, 1000)];
  pairs[0][0] -= pairs.reduce((s, [a, b]) => s + Math.max(a, b), 0) % 5;
  return pairs;
};
const sumPairs = list => {
  const left = new Array(60).fill(0);
  let count = 0;
  for (const x of list) { count += left[(60 - x % 60) % 60]; left[x % 60]++; }
  return count;
};
const centre = cluster => {
  let best = null, least = Infinity;
  for (const [x, y] of cluster) {
    let sum = 0;
    for (const [u, v] of cluster) sum += Math.hypot(x - u, y - v);
    if (sum < least) { least = sum; best = [x, y]; }
  }
  return best;
};
const clusterAnswer = clusters => {
  const centres = clusters.map(centre);
  const mean = i => centres.reduce((s, c) => s + c[i], 0) / centres.length;
  return `${Math.floor(mean(0) * 10000 + 1e-7)} ${Math.floor(mean(1) * 10000 + 1e-7)}`;
};
const makeClusters = (r, count, size) => {
  const spots = [[20, 15], [55, 40], [25, 70], [75, 80]];
  const at = c => (c * 100 + rand(r, -150, 150)) / 100;  // отступ до 1,5 от середины даёт квадрат со стороной 3
  return many(count, (_, i) => many(size, () => [at(spots[i][0]), at(spots[i][1])]));
};
const shuffled = (r, list) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) { const j = rand(r, 0, i); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
};
const clusterFile = (r, clusters) => shuffled(r, clusters.flat()).map(p => p.join(" ")).join("\n") + "\n";

const matching = (limit, step, test) => {
  const out = [];
  for (let x = step; x <= limit; x += step) if (test(String(x))) out.push(`${x} ${x / step}`);
  return out.join("\n");
};
const divisorCount = x => {
  let count = 0;
  for (let d = 1; d * d <= x; d++) if (x % d === 0) count += d * d === x ? 1 : 2;
  return count;
};
const biggestProper = x => { for (let d = 2; d * d <= x; d++) if (x % d === 0) return x / d; return 1; };
const sixDivisors = (a, b) => {
  const out = [];
  for (let x = a; x <= b; x++) if (divisorCount(x) === 6) out.push(`${x} ${biggestProper(x)}`);
  return out.join("\n");
};
const smallAndBig = x => { for (let d = 2; d * d <= x; d++) if (x % d === 0) return d + x / d; return 0; };
const firstWithFour = (from, count) => {
  const out = [];
  for (let x = from + 1; out.length < count; x++) { const m = smallAndBig(x); if (m % 10 === 4) out.push(`${x} ${m}`); }
  return out.join("\n");
};

const EGE_TASKS = [
  fileTask(24, "e24a", "Разные соседи", "24.txt",
    "Файл 24.txt содержит одну строку из букв A, B, C и D. Найди наибольшую длину подстроки, в которой любые две соседние буквы различны.",
    { input: "ABBCDDA", output: "3" }, `s = open("24.txt").read().strip()

best = run = 1
for i in range(1, len(s)):
    if s[i] == s[i - 1]:
        run = 1
    else:
        run += 1
    best = max(best, run)
print(best)
`, "Иди по строке и считай длину текущего участка. Когда соседние буквы совпали, начинай считать заново.",
    r => { const s = letters(r, 300000, "ABCD"); return [onFile("24.txt", "ABBCDDA\n", 3, "пример", false), onFile("24.txt", s + "\n", longestAlternating(s), "файл")]; }),
  fileTask(24, "e24b", "Не больше двух букв D", "24.txt",
    "Файл 24.txt содержит одну строку из букв A, B, C и D. Найди наибольшую длину подстроки, в которой не больше двух букв D.",
    { input: "DADBDCD", output: "5" }, `s = open("24.txt").read().strip()

best = left = d = 0
for right in range(len(s)):
    if s[right] == "D":
        d += 1
    while d > 2:
        if s[left] == "D":
            d -= 1
        left += 1
    best = max(best, right - left + 1)
print(best)
`, "Держи окно с двумя границами. Правая идёт вперёд, а левая догоняет её, когда букв D стало больше двух.",
    r => { const s = letters(r, 300000, "ABCD"); return [onFile("24.txt", "DADBDCD\n", 5, "пример", false), onFile("24.txt", s + "\n", longestFewD(s), "файл")]; }),
  fileTask(24, "e24c", "Самое длинное выражение", "24.txt",
    "Файл 24.txt содержит одну строку из цифр и знаков + и *. Выражение это числа, между которыми стоит ровно один знак. Число не начинается с нуля, но сам 0 можно использовать. Одно число тоже считается выражением. Найди длину самой длинной подстроки, которая является выражением.",
    { input: "05+12*3++7", output: "6" }, `import re

s = open("24.txt").read().strip()

number = "(0|[1-9][0-9]*)"
pattern = number + "([+*]" + number + ")*"
print(max(len(m.group()) for m in re.finditer(pattern, s)))
`, "Удобнее всего регулярное выражение из модуля re. Без него иди по строке и следи за границами чисел и знаков.",
    r => { const s = letters(r, 300000, "0123456789++*"); return [onFile("24.txt", "05+12*3++7\n", 6, "пример", false), onFile("24.txt", s + "\n", longestExpression(s), "файл")]; }),

  fileTask(25, "e25a", "Маска числа", null,
    "В маске символ ? означает ровно одну цифру, а символ * любую последовательность цифр, в том числе пустую. Найди все числа не больше 100 000 000, которые подходят под маску 3?5*7 и делятся на 7919. Выведи их по возрастанию: в каждой строке число и результат деления на 7919.",
    null, `from fnmatch import fnmatch

for x in range(7919, 10 ** 8 + 1, 7919):
    if fnmatch(str(x), "3?5*7"):
        print(x, x // 7919)
`, "Перебирай только числа, кратные 7919, а строку сравнивай с маской через fnmatch.",
    () => [{ label: "ответ", out: matching(1e8, 7919, s => /^3[0-9]5[0-9]*7$/.test(s)), hidden: true }], { start: "for x in range(7919, 10 ** 8 + 1, 7919):\n    pass\n" }),
  fileTask(25, "e25b", "Шесть делителей", null,
    "Найди все числа на отрезке от 240 000 до 241 000, у которых ровно 6 натуральных делителей, включая 1 и само число. Выведи их по возрастанию: в каждой строке число и его наибольший делитель, меньший самого числа.",
    null, `for x in range(240000, 241001):
    divisors = set()
    d = 1
    while d * d <= x:
        if x % d == 0:
            divisors.add(d)
            divisors.add(x // d)
        d += 1
    if len(divisors) == 6:
        print(x, sorted(divisors)[-2])
`, "Делители идут парами d и x // d, поэтому перебирать d достаточно до корня из x.",
    () => [{ label: "ответ", out: sixDivisors(240000, 241000), hidden: true }], { start: "for x in range(240000, 241001):\n    pass\n" }),
  fileTask(25, "e25c", "Сумма крайних делителей", null,
    "Для натурального числа N обозначим M(N) сумму его наименьшего и наибольшего делителей, не считая 1 и само N. Если таких делителей нет, M(N) = 0. Найди первые 5 чисел больше 700 000, у которых M(N) оканчивается на цифру 4. Выведи их по возрастанию: в каждой строке N и M(N).",
    null, `def m(n):
    d = 2
    while d * d <= n:
        if n % d == 0:
            return d + n // d
        d += 1
    return 0


x = 700001
found = 0
while found < 5:
    if m(x) % 10 == 4:
        print(x, m(x))
        found += 1
    x += 1
`, "Наименьший делитель d найдётся первым, а наибольший равен n // d.",
    () => [{ label: "ответ", out: firstWithFour(700000, 5), hidden: true }], { start: "n = 700001\n\nprint()\n" }),

  fileTask(26, "e26a", "Запись на флешку", "26.txt",
    "На флешке свободно S Мбайт, ученики принесли N файлов. Нужно записать как можно больше файлов, а затем выбрать такой набор из этого же количества файлов, в котором самый большой файл максимален. Первая строка файла 26.txt содержит S и N, следующие N строк размеры файлов. Выведи через пробел количество файлов и размер самого большого файла в таком наборе.",
    { input: "60 5\n10\n40\n20\n30\n25", output: "3 30" }, `with open("26.txt") as f:
    space, n = map(int, f.readline().split())
    sizes = sorted(int(line) for line in f)

used = k = 0
while k < n and used + sizes[k] <= space:
    used += sizes[k]
    k += 1

rest = space - used + sizes[k - 1]
biggest = max(x for x in sizes[k - 1:] if x <= rest)
print(k, biggest)
`, "Отсортируй размеры и бери самые маленькие. Потом убери последний взятый файл и найди самый большой, который влезет на его место.",
    r => {
      const make = () => { const sizes = numbers(r, 5000, 1, 1000); const space = rand(r, 200000, 900000); return onFile("26.txt", `${space} ${sizes.length}\n${sizes.join("\n")}\n`, packDisk(space, sizes), "файл"); };
      return [onFile("26.txt", "60 5\n10\n40\n20\n30\n25\n", "3 30", "пример", false), make(), make()];
    }),
  fileTask(26, "e26b", "Парковка", "26.txt",
    "На парковке K рядов по M мест, места в ряду идут подряд от 1 до M. Найди ряд с наибольшим номером, где есть два соседних свободных места. Если в этом ряду таких пар несколько, возьми пару с наименьшими номерами. Первая строка файла 26.txt содержит N, K и M, следующие N строк номер ряда и номер занятого места. Выведи через пробел номер ряда и меньший номер места в паре.",
    { input: "4 2 5\n2 1\n2 3\n2 5\n1 1", output: "1 2" }, `with open("26.txt") as f:
    n, rows, seats = map(int, f.readline().split())
    busy = {tuple(map(int, line.split())) for line in f}


def find():
    for row in range(rows, 0, -1):
        for seat in range(1, seats):
            if (row, seat) not in busy and (row, seat + 1) not in busy:
                return row, seat


print(*find())
`, "Сложи занятые места в множество: проверка в нём работает мгновенно. Ряды перебирай с конца.",
    r => {
      const make = () => {
        const rows = 1000, seats = 60, taken = [];
        for (let a = 1; a <= rows; a++) for (let b = 1; b <= seats; b++) if (r() < 0.97 && !(a === 1 && b < 3)) taken.push([a, b]);
        const list = shuffled(r, taken);
        return onFile("26.txt", `${list.length} ${rows} ${seats}\n${list.map(p => p.join(" ")).join("\n")}\n`, lastFreePair(rows, seats, list), "файл");
      };
      return [onFile("26.txt", "4 2 5\n2 1\n2 3\n2 5\n1 1\n", "1 2", "пример", false), make(), make()];
    }),
  fileTask(26, "e26c", "Расписание зала", "26.txt",
    "Заявки на актовый зал заданы временем начала и конца в минутах. Следующее мероприятие может начаться в ту же минуту, когда закончилось предыдущее. Нужно провести как можно больше мероприятий, а среди таких расписаний выбрать то, что заканчивается раньше всех. Первая строка файла 26.txt содержит N, следующие N строк начало и конец заявки. Выведи через пробел количество мероприятий и время конца последнего.",
    { input: "5\n1 4\n3 5\n0 6\n5 7\n8 9", output: "3 9" }, `with open("26.txt") as f:
    n = int(f.readline())
    events = [tuple(map(int, line.split())) for line in f]

events.sort(key=lambda e: e[1])
count = 0
end = -1
for start, finish in events:
    if start >= end:
        count += 1
        end = finish
print(count, end)
`, "Отсортируй заявки по времени конца и бери каждую, которая не пересекается с уже выбранной.",
    r => {
      const make = () => { const list = many(20000, () => { const a = rand(r, 0, 100000); return [a, a + rand(r, 1, 500)]; }); return onFile("26.txt", `${list.length}\n${list.map(p => p.join(" ")).join("\n")}\n`, meetings(list), "файл"); };
      return [onFile("26.txt", "5\n1 4\n3 5\n0 6\n5 7\n8 9\n", "3 9", "пример", false), make(), make()];
    }),

  fileTask(27, "e27a", "Сумма не кратна 5", "27.txt",
    "В файле 27.txt первая строка содержит N, следующие N строк пары натуральных чисел не больше 10 000. Из каждой пары нужно выбрать одно число так, чтобы сумма выбранных чисел была наибольшей и не делилась на 5. Такую сумму всегда можно получить. Выведи эту сумму. Проверка запускает программу на файле A, где 12 пар, и на файле B, где 100 000 пар.",
    { input: "3\n4 8\n6 1\n11 5", output: "21" }, `with open("27.txt") as f:
    n = int(f.readline())
    pairs = [tuple(map(int, line.split())) for line in f]

total = sum(max(p) for p in pairs)
if total % 5 == 0:
    total -= min(abs(a - b) for a, b in pairs if (a - b) % 5 != 0)
print(total)
`, "Возьми большее число из каждой пары. Если сумма делится на 5, поменяй выбор в одной паре так, чтобы потерять как можно меньше.",
    r => {
      const make = (n, label) => { const p = fivePairs(r, n); return onFile("27.txt", `${p.length}\n${p.map(x => x.join(" ")).join("\n")}\n`, pairsNotFive(p), label); };
      return [onFile("27.txt", "3\n4 8\n6 1\n11 5\n", 21, "пример", false), make(12, "файл A"), make(100000, "файл B")];
    }),
  fileTask(27, "e27b", "Пары с суммой кратной 60", "27.txt",
    "В файле 27.txt первая строка содержит N, следующие N строк натуральные числа не больше 100 000. Найди количество пар элементов, сумма которых делится на 60. Пара это два элемента с разными номерами, порядок внутри пары не важен. Проверка запускает программу на файле A, где 2000 чисел, и на файле B, где 100 000 чисел. Перебор всех пар на файле B не успеет закончиться.",
    { input: "5\n10\n50\n30\n30\n70", output: "3" }, `with open("27.txt") as f:
    n = int(f.readline())
    numbers = [int(line) for line in f]

seen = [0] * 60
count = 0
for x in numbers:
    count += seen[(60 - x % 60) % 60]
    seen[x % 60] += 1
print(count)
`, "Важен только остаток от деления на 60. Считай, сколько раз уже встретился каждый остаток.",
    r => {
      const make = (n, label) => { const l = numbers(r, n, 1, 100000); return onFile("27.txt", `${n}\n${l.join("\n")}\n`, sumPairs(l), label); };
      return [onFile("27.txt", "5\n10\n50\n30\n30\n70\n", 3, "пример", false), make(2000, "файл A"), make(100000, "файл B")];
    }),
  fileTask(27, "e27c", "Кластеры точек", "27.txt",
    "В файле 27.txt каждая строка содержит координаты x и y одной точки. Точки образуют кластеры. Все точки кластера лежат внутри квадрата со стороной 3, а точки разных кластеров находятся на расстоянии больше 5. Центр кластера это его точка с наименьшей суммой расстояний до остальных точек этого кластера. Px и Py это средние арифметические координат x и y всех центров. Выведи через пробел целую часть Px × 10000 и целую часть Py × 10000. Проверка запускает программу на файле A, где 2 кластера и 120 точек, и на файле B, где 3 кластера и 1500 точек.",
    { input: "1 1\n1 2\n1 3\n10 10\n10 11\n10 12", output: "55000 65000" }, `from math import dist

with open("27.txt") as f:
    points = [tuple(map(float, line.split())) for line in f]

clusters = []
for p in points:
    for c in clusters:
        if dist(p, c[0]) < 5:
            c.append(p)
            break
    else:
        clusters.append([p])

centres = [min(c, key=lambda p: sum(dist(p, q) for q in c)) for c in clusters]
px = sum(c[0] for c in centres) / len(centres)
py = sum(c[1] for c in centres) / len(centres)
print(int(px * 10000), int(py * 10000))
`, "Сначала разложи точки по кластерам: точка попадает к той группе, первая точка которой ближе 5. Затем в каждой группе найди центр перебором.",
    r => {
      const make = (count, size, label) => { const c = makeClusters(r, count, size); return { ...onFile("27.txt", clusterFile(r, c), clusterAnswer(c), label), near: 1 }; };
      return [{ ...onFile("27.txt", "1 1\n1 2\n1 3\n10 10\n10 11\n10 12\n", "55000 65000", "пример", false), near: 1 }, make(2, 60, "файл A"), make(3, 500, "файл B")];
    }),
];

const TASKS = { oge: OGE_TASKS, ege: EGE_TASKS };

const seedOf = id => [...id].reduce((s, c) => s * 31 + c.charCodeAt(0) | 0, 7);
const answerTestsOf = (task, tests) => {  // файл A и B в задании 27 решаются оба, в остальных заданиях ответа по одному файлу достаточно
  const hidden = tests.filter(t => t.hidden);
  return task.no === 27 ? hidden : hidden.slice(0, 1);
};
// Бот присылает те же файлы, что считает страница. После правки заданий их нужно собрать заново: tools/export_code_files.py
const fileNameOf = (test, name) => test.label === "файл B" ? name.replace(".", "b.") : test.label === "файл A" ? name.replace(".", "a.") : name;
