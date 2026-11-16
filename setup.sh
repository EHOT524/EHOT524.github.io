#!/bin/bash
# Установка выкладки бота через GitHub. Собран tools/server/make_setup.py, не править руками.
set -e
command -v git >/dev/null || { apt-get update -qq && apt-get install -y -qq git; }
cat > /usr/local/bin/physbot-update.py <<'PHYSBOT_EOF'
#!/usr/bin/env python3
"""Выкладка бота через GitHub, без SSH: сервер сам забирает ветку release закрытого репозитория.

Таймер physbot-update.timer запускает скрипт каждые 2 минуты от root. Если в ветке release новый коммит:
копия базы → код в /opt/physbot (база и .env не трогаются) → пакеты → перезапуск → проверка.
Если бот не поднялся или в журнале Traceback, возвращается прошлый код. Итог приходит владельцу в Telegram
(NOTIFY_CHAT в /etc/physbot-update.conf) прямо через API: сообщение доходит, даже если бот сломан.
Выкладка с компьютера: git push origin main:release (только после согласия пользователя).
"""
import fcntl
import json
import shutil
import sqlite3
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

REPO = "git@github.com:EHOT524/newton-bot.git"
SRC = Path("/opt/physbot-src")          # клон репозитория, ключ только на чтение (/root/.ssh/newton_deploy)
APP = Path("/opt/physbot")              # рабочая папка бота: здесь база, .env и .venv
PREV = Path("/opt/physbot-prev")        # прошлый код для отката
STATE = Path("/var/lib/physbot-update/deployed")
CONF = Path("/etc/physbot-update.conf")
PARTS = ["app", "materials", "main.py", "requirements.txt", "selfcheck.py", "README.md"]  # то же, что отправлял deploy.ps1
WAIT = 25  # секунд после перезапуска: бот должен успеть начать опрос Telegram


def run(*cmd, cwd=None, check=True) -> str:
    out = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if check and out.returncode:
        raise RuntimeError(f"{' '.join(cmd[:3])}: {(out.stderr or out.stdout).strip()[-300:]}")
    return out.stdout.strip()


def env(path: Path) -> dict:
    pairs = (line.split("=", 1) for line in path.read_text(encoding="utf-8").splitlines() if "=" in line and not line.startswith("#"))
    return {k.strip(): v.strip().strip('"') for k, v in pairs}


def notify(text: str):
    chat = env(CONF).get("NOTIFY_CHAT")
    token = env(APP / ".env").get("BOT_TOKEN")
    if not chat or not token:
        return
    data = urllib.parse.urlencode({"chat_id": chat, "text": text}).encode()
    try:
        urllib.request.urlopen(f"https://api.telegram.org/bot{token}/sendMessage", data, timeout=20)
    except Exception as e:
        print("Сообщение владельцу не ушло:", e, file=sys.stderr)


def backup_db():
    """Онлайн-копия базы перед обновлением: если новая схема испортит данные, есть откуда вернуть."""
    dest = APP / "physbot-before-update.db"
    with sqlite3.connect(APP / "physbot.db") as src, sqlite3.connect(dest) as dst:
        src.backup(dst)
    shutil.chown(dest, "physbot", "physbot")
    dest.chmod(0o600)


def copy_code(source: Path, target: Path):
    for part in PARTS:
        dst = target / part
        if dst.is_dir():
            shutil.rmtree(dst)
        elif dst.exists():
            dst.unlink()
        src = source / part
        if src.is_dir():
            shutil.copytree(src, dst, ignore=shutil.ignore_patterns("__pycache__"))
        elif src.exists():
            shutil.copy2(src, dst)


def restart_ok() -> tuple[bool, str]:
    since = time.strftime("%Y-%m-%d %H:%M:%S")
    run("systemctl", "restart", "physbot")
    time.sleep(WAIT)
    active = run("systemctl", "is-active", "physbot", check=False) == "active"
    log = run("journalctl", "-u", "physbot", "--since", since, "--no-pager", "-o", "cat", check=False)
    if not active or "Traceback" in log or "Start polling" not in log:
        lines = [l for l in log.splitlines() if l.strip()]
        return False, lines[-1][-200:] if lines else "бот не запустился"
    return True, ""


def install():
    run(str(APP / ".venv/bin/pip"), "install", "-q", "-r", str(APP / "requirements.txt"))
    run("chown", "-R", "physbot:physbot", str(APP))


def main():
    STATE.parent.mkdir(parents=True, exist_ok=True)
    lock = open(STATE.parent / "lock", "w")
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        return
    try:
        if not (SRC / ".git").exists():  # первый запуск: клон появится, когда ключ сервера добавят в GitHub
            if SRC.exists():
                shutil.rmtree(SRC)
            run("git", "clone", "-q", "--branch", "release", REPO, str(SRC))
        run("git", "fetch", "-q", "origin", "release", cwd=SRC)
    except RuntimeError as e:  # нет сети до GitHub или ключа: попробуем через 2 минуты
        print(e, file=sys.stderr)
        return
    new = run("git", "rev-parse", "origin/release", cwd=SRC)
    old = STATE.read_text().strip() if STATE.exists() else ""
    if new == old:
        return
    STATE.write_text(new)  # сразу: неудачный коммит не будет перезапускаться каждые 2 минуты
    run("git", "reset", "-q", "--hard", new, cwd=SRC)
    title = run("git", "log", "-1", "--format=%s", new, cwd=SRC)
    short = new[:7]
    try:
        backup_db()
        if PREV.exists():
            shutil.rmtree(PREV)
        PREV.mkdir()
        copy_code(APP, PREV)
        copy_code(SRC, APP)
        install()
        ok, why = restart_ok()
    except Exception as e:
        ok, why = False, str(e)[-300:]
    if ok:
        notify(f"✅ Бот обновлён и работает.\n{title}\nВерсия {short}")
        return
    try:
        copy_code(PREV, APP)
        install()
        back, _ = restart_ok()
    except Exception:
        back = False
    notify(f"⚠️ Обновление не запустилось: {why}\n"
           + ("Вернул прошлую версию, бот работает." if back else "Вернуть прошлую версию не удалось, бот может не работать!")
           + f"\n{title}\nВерсия {short}")


if __name__ == "__main__":
    main()
PHYSBOT_EOF
chmod 755 /usr/local/bin/physbot-update.py
cat > /etc/systemd/system/physbot-update.service <<'PHYSBOT_EOF'
[Unit]
Description=Physbot: обновление кода из GitHub (ветка release)
After=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/bin/python3 /usr/local/bin/physbot-update.py
PHYSBOT_EOF
cat > /etc/systemd/system/physbot-update.timer <<'PHYSBOT_EOF'
[Unit]
Description=Physbot: проверять обновления каждые 2 минуты

[Timer]
OnBootSec=2min
OnUnitActiveSec=2min

[Install]
WantedBy=timers.target
PHYSBOT_EOF

mkdir -p /root/.ssh && chmod 700 /root/.ssh
[ -f /root/.ssh/newton_deploy ] || ssh-keygen -q -t ed25519 -N '' -C physbot-server -f /root/.ssh/newton_deploy
grep -q newton_deploy /root/.ssh/config 2>/dev/null || cat >> /root/.ssh/config <<'PHYSBOT_EOF'

Host github.com
    IdentityFile /root/.ssh/newton_deploy
    IdentitiesOnly yes
    StrictHostKeyChecking accept-new
PHYSBOT_EOF
chmod 600 /root/.ssh/config

python3 - <<'PHYSBOT_EOF'
import json, sqlite3, urllib.parse, urllib.request
db = sqlite3.connect("/opt/physbot/physbot.db")
chat = db.execute("SELECT id FROM users WHERE lower(username) = lower(?)", ("EHOT524",)).fetchone()[0]
open("/etc/physbot-update.conf", "w").write(f"NOTIFY_CHAT={chat}\n")
env = dict(l.strip().split("=", 1) for l in open("/opt/physbot/.env", encoding="utf-8") if "=" in l and not l.startswith("#"))
token = env["BOT_TOKEN"].strip().strip('"')
key = open("/root/.ssh/newton_deploy.pub").read().strip()
text = "🔑 Ключ сервера для GitHub. Скопируй строку ниже целиком и пришли Claude:\n\n<code>" + key + "</code>"
data = urllib.parse.urlencode({"chat_id": chat, "text": text, "parse_mode": "HTML"}).encode()
urllib.request.urlopen(f"https://api.telegram.org/bot{token}/sendMessage", data, timeout=20)
print("Ключ отправлен в Telegram")
PHYSBOT_EOF

systemctl daemon-reload
systemctl enable --now physbot-update.timer
echo "ГОТОВО: выкладка через GitHub установлена. Ключ пришёл в Telegram."
