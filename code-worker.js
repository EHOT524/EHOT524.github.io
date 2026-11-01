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
  const result = python.globals.get("run_student")(data.code, data.input || "");
  postMessage({ type: "done", id: data.id, ...JSON.parse(result) });
};
