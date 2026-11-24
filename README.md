# Menschen A1.1 — программа уроков

Программа для учителя по рабочей тетради Menschen A1.1: 28 занятий по 90 минут
(30 мин проверка ДЗ + 60 мин новая тема), слова с переводом на русский и таджикский
без повторов, правила на немецком и русском, озвучка, опрос, экспорт таблиц картинкой.

Сайт: https://ziyoda.munavarovbi.com — статические файлы, сервер не нужен.
Открыть локально: `index.html` двойным щелчком.

## Выкладка на сервер (один раз)

```sh
sudo git clone https://github.com/AlimMunavarov-04/ziyoda.munavarov-.git /var/www/ziyoda
sudo chown -R planner:planner /var/www/ziyoda
sudo cp /var/www/ziyoda/deploy/nginx-ziyoda.conf /etc/nginx/sites-available/ziyoda
sudo ln -sf /etc/nginx/sites-available/ziyoda /etc/nginx/sites-enabled/ziyoda
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d ziyoda.munavarovbi.com
# автообновление раз в минуту:
(crontab -l 2>/dev/null; echo "* * * * * sh /var/www/ziyoda/deploy/update.sh") | crontab -
```

После этого любой push в `main` появляется на сайте в течение минуты.
