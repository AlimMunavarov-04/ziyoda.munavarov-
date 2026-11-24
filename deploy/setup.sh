#!/bin/sh
# Разовая настройка входа по паролю. Запуск: sudo sh /var/www/ziyoda/deploy/setup.sh <логин_учителя>
set -e
APP=/var/www/ziyoda
DATA=/home/planner/ziyoda-data
U=planner
TEACHER="$1"

if [ "$(id -u)" != "0" ]; then echo "Запустите через sudo"; exit 1; fi
if ! systemctl is-active -q ziyoda && ss -ltn | grep -q ':8097 '; then echo "Порт 8097 уже занят другой программой"; exit 1; fi

echo "1/5 Python-окружение"
python3 -c "import ensurepip" >/dev/null 2>&1 || apt-get install -y python3-venv
[ -x "$APP/.venv/bin/python" ] || sudo -u $U python3 -m venv "$APP/.venv"
sudo -u $U "$APP/.venv/bin/pip" install -q --upgrade pip
sudo -u $U "$APP/.venv/bin/pip" install -q -r "$APP/server/requirements.txt"

echo "2/5 База данных"
sudo -u $U mkdir -p "$DATA" /home/$U/backups
chmod 700 "$DATA"
sudo -u $U env ZIYODA_DATA="$DATA" "$APP/.venv/bin/python" -c "import sys; sys.path.insert(0, '$APP/server'); import app"

echo "3/5 Служба ziyoda"
cp "$APP/deploy/ziyoda.service" /etc/systemd/system/ziyoda.service
systemctl daemon-reload
systemctl enable -q ziyoda
systemctl restart ziyoda
sleep 2
if curl -fsS http://127.0.0.1:8097/api/health >/dev/null; then echo "   служба работает"; else
  echo "Служба не запустилась:"; journalctl -u ziyoda -n 30 --no-pager; exit 1; fi

echo "4/5 nginx"
[ -f /etc/nginx/sites-available/ziyoda ] && cp /etc/nginx/sites-available/ziyoda /etc/nginx/sites-available/ziyoda.bak
cp "$APP/deploy/nginx-ziyoda.conf" /etc/nginx/sites-available/ziyoda
ln -sf /etc/nginx/sites-available/ziyoda /etc/nginx/sites-enabled/ziyoda
if nginx -t 2>/dev/null; then systemctl reload nginx; else
  echo "nginx: ошибка в настройке, возвращаю старую"; cp /etc/nginx/sites-available/ziyoda.bak /etc/nginx/sites-available/ziyoda; nginx -t; exit 1; fi

echo "5/5 Автообновление и копии базы"
( crontab -u $U -l 2>/dev/null | grep -v ziyoda
  echo "* * * * * sh $APP/deploy/update.sh"
  echo "10 3 * * * sqlite3 $DATA/ziyoda.db \".backup '/home/$U/backups/ziyoda-\$(date +\%F).db'\" && find /home/$U/backups -name 'ziyoda-*.db' -mtime +14 -delete"
) | crontab -u $U -

if [ -n "$TEACHER" ]; then
  echo "Учётная запись учителя «$TEACHER» — придумайте пароль:"
  cd "$APP/server" && sudo -u $U env ZIYODA_DATA="$DATA" "$APP/.venv/bin/python" manage.py teacher "$TEACHER"
fi
echo "ГОТОВО: https://ziyoda.munavarovbi.com"
