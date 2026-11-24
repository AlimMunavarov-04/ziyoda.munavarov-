#!/bin/sh
# Забирает свежую версию из GitHub. Сайт статический, перезапуск не нужен.
cd /var/www/ziyoda && git pull --ff-only -q origin main
