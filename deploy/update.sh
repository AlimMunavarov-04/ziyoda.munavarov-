#!/bin/sh
# Раз в минуту (cron): забирает свежую версию из GitHub и перезагружает программу.
APP=/var/www/ziyoda
PID=/home/planner/ziyoda-data/gunicorn.pid
cd "$APP" || exit 1
old=$(git rev-parse HEAD)
git pull --ff-only -q origin main || exit 1
new=$(git rev-parse HEAD)
[ "$old" = "$new" ] && exit 0
if git diff --name-only "$old" "$new" | grep -q '^server/requirements.txt'; then
  "$APP/.venv/bin/pip" install -q -r server/requirements.txt
fi
[ -f "$PID" ] && kill -HUP "$(cat "$PID")"
exit 0
