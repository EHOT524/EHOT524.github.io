// Python работает отдельно от страницы: зависшую программу ученика можно остановить, не закрывая сайт
import { loadPyodide } from "./pyodide/pyodide.mjs";

const HARNESS = `
import io, json, sys, traceback

HINTS = {
    "IndentationError": "Проверь отступы: внутри if, for и while строки сдвигаются на 4 пробела.",
    "TabError": "Проверь отступы: внутри if, for и while строки сдвигаются на 4 пробела.",
    "SyntaxError": "Python не понял запись. Проверь двоеточия, скобки, кавычки и знак == в условиях.",
    "NameError": "Такого имени нет. Проверь написание и задана ли переменная до этой строки.",
    "TypeError": "Здесь смешаны разные типы данных, например строка и число.",
    "ValueError": "Значение не подходит, например в числе оказалась буква или пустая строка.",
    "ZeroDivisionError": "Здесь деление на ноль.",
    "IndexError": "Номер элемента вышел за границы списка или строки.",
    "KeyError": "В словаре нет такого ключа.",
    "EOFError": "Программа просит данные, а они закончились. Проверь условие остановки цикла.",
    "FileNotFoundError": "Такого файла нет. Имя файла написано в условии.",
    "RecursionError": "Функция вызывает сама себя слишком много раз.",
    "MemoryError": "Программе не хватило памяти.",
}


class Output(io.StringIO):
    def write(self, text):
        if self.tell() > 1000000:
            raise MemoryError("слишком много вывода")
        return super().write(text)


def explain(error):
    name = type(error).__name__
    line = error.lineno if isinstance(error, SyntaxError) else None
    for frame in traceback.extract_tb(error.__traceback__):
        if frame.filename == "код":
            line = frame.lineno
    where = f"Ошибка в строке {line}" if line else "Ошибка"
    hint = HINTS.get(name, "")
    return f"{where}: {hint}\\n{name}: {error}".strip()


def run_student(code, given):
    lines, out = io.StringIO(given), Output()

    def read(prompt=""):  # подсказка из input() не должна попасть в ответ программы
        line = lines.readline()
        if not line:
            raise EOFError("данные закончились")
        return line.rstrip("\\r\\n")

    stdin, stdout = sys.stdin, sys.stdout
    sys.stdin, sys.stdout = lines, out
    error = ""
    try:
        exec(compile(code, "код", "exec"), {"__name__": "__main__", "input": read})
    except SystemExit:
        pass
    except BaseException as e:
        error = explain(e)
    finally:
        sys.stdin, sys.stdout = stdin, stdout
    return json.dumps({"out": out.getvalue(), "error": error})


class Crash(Exception):
    pass


def run_robot(code, raw):
    f = json.loads(raw)
    top, left, painted, trace = set(f["top"]), set(f["left"]), set(), []
    x, y, steps = f["x"], f["y"], 0

    def tick():
        nonlocal steps
        steps += 1
        if steps > 200000:
            raise Crash("Робот не остановился: похоже, цикл никогда не заканчивается.")

    def open_side(dx, dy):
        tick()
        if dx:
            return f"{x + max(dx, 0)},{y}" not in left
        return f"{x},{y + max(dy, 0)}" not in top

    def go(dx, dy, mark):
        nonlocal x, y
        if not open_side(dx, dy):
            raise Crash("Робот врезался в стену и разбился.")
        x, y = x + dx, y + dy
        trace.append(mark)
        if not (0 <= x < f["w"] and 0 <= y < f["h"]):
            raise Crash("Робот ушёл за край поля. На бесконечном поле он шёл бы вечно: проверь условие цикла.")

    def paint():
        tick()
        painted.add(f"{x},{y}")
        trace.append("p")

    def is_painted():
        tick()
        return f"{x},{y}" in painted

    names = {
        "вправо": lambda: go(1, 0, "r"), "влево": lambda: go(-1, 0, "l"), "вверх": lambda: go(0, -1, "u"), "вниз": lambda: go(0, 1, "d"),
        "закрасить": paint, "клетка_закрашена": is_painted,
        "справа_свободно": lambda: open_side(1, 0), "слева_свободно": lambda: open_side(-1, 0),
        "сверху_свободно": lambda: open_side(0, -1), "снизу_свободно": lambda: open_side(0, 1),
    }
    error = crash = ""
    try:
        exec(compile(code, "код", "exec"), {"__name__": "__main__", **names})
    except Crash as e:
        crash = str(e)
    except BaseException as e:
        error = explain(e)
    return json.dumps({"painted": sorted(painted), "trace": "".join(trace[:20000]), "crash": crash, "error": error})
`;

let python;
const ready = loadPyodide({ indexURL: new URL("./pyodide/", import.meta.url).href }).then(p => {
  python = p;
  python.runPython(HARNESS);
  postMessage({ type: "ready" });
}).catch(e => postMessage({ type: "fatal", error: String(e) }));

onmessage = async ({ data }) => {
  await ready;
  for (const [name, text] of Object.entries(data.files || {})) python.FS.writeFile(name, text);
  const result = data.robot ? python.globals.get("run_robot")(data.code, JSON.stringify(data.robot))
    : python.globals.get("run_student")(data.code, data.input || "");
  postMessage({ type: "done", id: data.id, ...JSON.parse(result) });
};
