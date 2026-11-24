// Грамматика и фонетика: правило на немецком и на русском + примеры.
// Тексты правил написаны для этой программы (не скопированы из книги).
window.RULES = {
  "w-frage": {
    t: "W-Fragen · Вопросы с вопросительным словом",
    de: "Das W-Wort (wer, wie, woher, wo, was …) steht auf Position 1, das Verb auf Position 2, dann kommt das Subjekt.",
    ru: "Вопросительное слово (wer, wie, woher, wo, was …) стоит на 1-м месте, глагол на 2-м, затем подлежащее.",
    ex: ["Wie heißt du?", "Woher kommst du?", "Wer ist das?"]
  },
  "aussage": {
    t: "Aussagesatz · Повествовательное предложение",
    de: "Im Aussagesatz steht das Verb immer auf Position 2.",
    ru: "В утвердительном предложении глагол всегда стоит на 2-м месте.",
    ex: ["Ich heiße Paco.", "Ich komme aus Österreich.", "Mein Name ist Valerie."]
  },
  "du-sie": {
    t: "du oder Sie? · «ты» или «Вы»?",
    de: "du: Familie, Freunde, Kinder, oft auch junge Leute. Sie: fremde Erwachsene, Kollegen, Chef, offizielle Situationen (Herr …, Frau …). Sie schreibt man immer groß.",
    ru: "du («ты»): семья, друзья, дети, часто молодёжь. Sie («Вы»): незнакомые взрослые, коллеги, начальник, официальные ситуации (Herr …, Frau …). Sie всегда пишется с большой буквы.",
    ex: ["Woher kommst du, Kolja?", "Woher kommen Sie, Frau Klein?"]
  },
  "konj-1": {
    t: "Konjugation Präsens (ich, du, er/sie, Sie)",
    de: "Stamm + Endung: ich -e, du -st, er/sie -t, Sie -en. sein ist unregelmäßig: ich bin, du bist, er/sie ist, Sie sind.",
    ru: "Основа + окончание: ich -e, du -st, er/sie -t, Sie -en. Глагол sein («быть») неправильный: ich bin, du bist, er/sie ist, Sie sind.",
    ex: ["ich komme – du kommst – er kommt – Sie kommen", "ich heiße – du heißt (ß: nur -t!)"]
  },
  "satzmelodie": {
    t: "Satzmelodie · Интонация",
    de: "Aussage ↘ (Stimme geht runter). W-Frage ↘. Rückfrage mit „Und du?“ / „Und Sie?“ ↗ (Stimme geht hoch).",
    ru: "Утверждение ↘ (голос понижается). Вопрос с W-словом ↘. Встречный вопрос «Und du? / Und Sie?» ↗ (голос повышается).",
    ex: ["Ich heiße Anna. ↘", "Wie heißt du? ↘", "Und du? ↗"]
  },
  "alphabet": {
    t: "Alphabet · Алфавит",
    de: "26 Buchstaben + ä, ö, ü und ß (eszett). Beim Buchstabieren sagt man jeden Buchstaben einzeln: M-E-Y-E-R.",
    ru: "26 букв + ä, ö, ü и ß («эсцет» = двойное s). При диктовке по буквам каждую букву называют отдельно: M-E-Y-E-R.",
    ex: ["A, B, C, D, E, F", "Ä, Ö, Ü, ß", "Wie schreibt man das? – M-E-Y-E-R."]
  },
  "konj-2": {
    t: "Konjugation: alle Personen",
    de: "ich -e, du -st, er/sie/es -t, wir -en, ihr -t, sie/Sie -en. Stamm auf -t/-d (arbeiten): du arbeitest, er arbeitet, ihr arbeitet (+e).",
    ru: "ich -e, du -st, er/sie/es -t, wir -en, ihr -t, sie/Sie -en. Если основа на -t/-d (arbeiten), добавляется -e-: du arbeitest, er arbeitet, ihr arbeitet.",
    ex: ["wir wohnen, ihr wohnt, sie wohnen", "du arbeitest, er arbeitet"]
  },
  "haben-sein": {
    t: "haben und sein",
    de: "haben: ich habe, du hast, er hat, wir haben, ihr habt, sie/Sie haben. sein: ich bin, du bist, er ist, wir sind, ihr seid, sie/Sie sind.",
    ru: "haben («иметь»): ich habe, du hast, er hat, wir haben, ihr habt, sie/Sie haben. sein («быть»): ich bin, du bist, er ist, wir sind, ihr seid, sie/Sie sind.",
    ex: ["Ich habe zwei Kinder.", "Wir sind verheiratet."]
  },
  "als-bei-in": {
    t: "als, bei, in",
    de: "als + Beruf: Ich arbeite als Journalistin. bei + Firma: Ich arbeite bei X-Media. in + Ort: Ich lebe in Köln.",
    ru: "als + профессия («в качестве»), bei + фирма («в компании»), in + город («в»).",
    ex: ["Ich arbeite als Lehrer.", "Er arbeitet bei BMW.", "Sie wohnt in Wien."]
  },
  "nicht": {
    t: "Negation mit nicht · Отрицание nicht",
    de: "nicht verneint ein Verb, ein Adjektiv oder den ganzen Satz. Es steht oft am Ende oder vor dem Wort, das verneint wird.",
    ru: "nicht отрицает глагол, прилагательное или всё предложение. Обычно стоит в конце или перед словом, которое отрицается.",
    ex: ["Wir leben nicht zusammen.", "Sie wohnt nicht in Köln.", "Das ist nicht richtig."]
  },
  "beruf-in": {
    t: "Berufe: männlich / weiblich",
    de: "Die weibliche Form bekommt meist -in (Plural -innen): der Lehrer → die Lehrerin. Manchmal mit Umlaut: der Arzt → die Ärztin.",
    ru: "Женская форма профессии обычно получает -in (мн. ч. -innen): der Lehrer → die Lehrerin. Иногда с умлаутом: der Arzt → die Ärztin.",
    ex: ["der Student – die Studentin", "der Arzt – die Ärztin"]
  },
  "zahlen": {
    t: "Zahlen 0–100 · Числа",
    de: "13–19: drei + zehn = dreizehn. Zehner: zwanzig, dreißig (ß!), vierzig … 21–99: zuerst die Einer, dann und, dann die Zehner: einundzwanzig. Achtung: sechzehn, siebzehn, sechzig, siebzig.",
    ru: "13–19: drei + zehn = dreizehn. Десятки: zwanzig, dreißig (ß!), vierzig … 21–99: сначала единицы, потом und, потом десятки: einundzwanzig = «один-и-двадцать». Внимание: sechzehn, siebzehn, sechzig, siebzig (без -s / -en).",
    ex: ["einundzwanzig (21)", "siebenunddreißig (37)", "neunundneunzig (99)"]
  },
  "wortakzent": {
    t: "Wortakzent · Ударение в слове",
    de: "Deutsche Wörter haben den Akzent oft auf Silbe 1 (Lehrer). Internationale Wörter oft auf der letzten Silbe (Student, Journalist, Friseur). Im Zweifel: Wörterbuch!",
    ru: "В немецких словах ударение часто на 1-м слоге (Lehrer). В интернациональных — часто на последнем (Student, Journalist, Friseur). Если сомневаетесь — смотрите словарь.",
    ex: ["Lehrer", "Student", "Ingenieur"]
  },
  "possessiv": {
    t: "Possessivartikel mein / dein",
    de: "maskulin/neutral: mein, dein (mein Bruder). feminin und Plural: meine, deine (meine Schwester, meine Eltern).",
    ru: "Мужской/средний род: mein, dein (mein Bruder — мой брат). Женский род и мн. число: meine, deine (meine Schwester, meine Eltern).",
    ex: ["Das ist mein Vater.", "Das ist meine Mutter.", "Sind das deine Kinder?"]
  },
  "ja-nein-frage": {
    t: "Ja-/Nein-Frage · Вопрос без вопросительного слова",
    de: "Das Verb steht auf Position 1. Die Antwort ist ja oder nein.",
    ru: "Глагол стоит на 1-м месте. Ответ — ja или nein.",
    ex: ["Ist das deine Frau?", "Kommst du aus Spanien?", "Sprechen Sie Deutsch?"]
  },
  "doch": {
    t: "ja – nein – doch",
    de: "Auf eine negative Frage antwortet man positiv mit doch (nicht mit ja).",
    ru: "На вопрос с отрицанием утвердительно отвечают doch (а не ja).",
    ex: ["Ist das nicht dein Bruder? – Doch!", "Bist du nicht verheiratet? – Doch, ich bin verheiratet."]
  },
  "vokalwechsel-e-i": {
    t: "Verben mit Vokalwechsel e → i",
    de: "Bei manchen Verben ändert sich der Vokal bei du und er/sie/es: sprechen → du sprichst, er spricht.",
    ru: "У некоторых глаголов гласная меняется в формах du и er/sie/es: sprechen → du sprichst, er spricht.",
    ex: ["ich spreche, du sprichst, er spricht", "wir sprechen, ihr sprecht"]
  },
  "melodie-fragen": {
    t: "Satzmelodie bei Fragen",
    de: "W-Frage: Melodie geht am Ende runter ↘. Ja-/Nein-Frage: Melodie geht am Ende hoch ↗.",
    ru: "Вопрос с W-словом: в конце голос понижается ↘. Вопрос «да/нет»: в конце голос повышается ↗.",
    ex: ["Wo wohnst du? ↘", "Wohnst du in Berlin? ↗"]
  },
  "artikel": {
    t: "Bestimmter Artikel der / das / die",
    de: "Jedes Nomen hat ein Genus: der (maskulin), das (neutral), die (feminin). Plural immer die. Lernen Sie jedes Nomen mit Artikel! Nomen schreibt man groß.",
    ru: "У каждого существительного есть род: der (м. р.), das (ср. р.), die (ж. р.). Во мн. числе всегда die. Учите каждое существительное вместе с артиклем! Существительные пишутся с большой буквы.",
    ex: ["der Tisch", "das Bett", "die Lampe"]
  },
  "pron-er-es-sie": {
    t: "Personalpronomen er / es / sie",
    de: "der → er, das → es, die → sie. Das gilt auch für Sachen!",
    ru: "der → er, das → es, die → sie. Это правило действует и для предметов: стол — «он», лампа — «она».",
    ex: ["Der Tisch ist schön. Er kostet 450 Euro.", "Das Bett ist neu. Es ist praktisch."]
  },
  "zahlen-gross": {
    t: "Große Zahlen und Preise",
    de: "100 = (ein)hundert, 1000 = (ein)tausend, 1 000 000 = eine Million. Man schreibt sie als ein Wort: dreihundertdreiundzwanzig. Preise: 0,99 € = neunundneunzig Cent; 12,50 € = zwölf Euro fünfzig.",
    ru: "100 = (ein)hundert, 1000 = (ein)tausend, 1 000 000 = eine Million. Числа пишутся одним словом: dreihundertdreiundzwanzig. Цены: 0,99 € = neunundneunzig Cent; 12,50 € = zwölf Euro fünfzig.",
    ex: ["dreihundertdreiundzwanzig (323)", "siebzehntausend (17 000)", "zwölf Euro fünfzig"]
  },
  "vokale-lang-kurz": {
    t: "Lange und kurze Vokale",
    de: "Vor einem Doppelkonsonanten ist der Vokal kurz (Bett, Sessel). Lang ist er bei Doppelvokal (Tee), bei ie (wie) und bei Vokal + h (sehr, Stuhl).",
    ru: "Перед удвоенной согласной гласная краткая (Bett, Sessel). Долгая — при удвоенной гласной (Tee), в ie (wie) и при гласной + h (sehr, Stuhl).",
    ex: ["kurz: Bett, Tisch, kosten", "lang: Sofa, Stuhl, sehr, wie"]
  },
  "ein-eine": {
    t: "Unbestimmter Artikel ein / eine",
    de: "Neue oder unbekannte Dinge: ein (maskulin, neutral), eine (feminin). Bekannte Dinge: der/das/die.",
    ru: "Новый/неизвестный предмет: ein (м. и ср. р.), eine (ж. р.). Уже известный, конкретный: der/das/die.",
    ex: ["Das ist ein Schlüssel. Der Schlüssel ist neu.", "Das ist eine Brille. Die Brille ist teuer."]
  },
  "kein": {
    t: "Negativartikel kein / keine",
    de: "kein verneint ein Nomen mit ein/eine oder ohne Artikel: kein (maskulin, neutral), keine (feminin, Plural).",
    ru: "kein отрицает существительное с ein/eine или без артикля: kein (м. и ср. р.), keine (ж. р. и мн. ч.).",
    ex: ["Das ist kein Buch.", "Das ist keine Uhr.", "Ich habe keine Zeit."]
  },
  "nicht-kein": {
    t: "nicht oder kein?",
    de: "kein + Nomen (mit ein/eine oder ohne Artikel). nicht + Verb, Adjektiv oder Nomen mit der/das/die.",
    ru: "kein — перед существительным (которое было бы с ein/eine или без артикля). nicht — для глагола, прилагательного или существительного с der/das/die.",
    ex: ["Das ist kein Handy.", "Das Handy ist nicht neu.", "Ich rauche nicht."]
  },
  "satzakzent": {
    t: "Satzakzent · Фразовое ударение",
    de: "Der Satzakzent liegt auf der wichtigen oder neuen Information.",
    ru: "Фразовое ударение падает на важную или новую информацию.",
    ex: ["Was ist das? – Das ist eine UHR.", "Wie heißt das auf DEUTSCH?"]
  },
  "plural": {
    t: "Plural · Множественное число",
    de: "Es gibt fünf Plural-Typen: -(e)n (Briefmarken), -e/¨e (Stifte, Schränke), -s (Sofas), -er/¨er (Bilder, Bücher), -/¨ (Kalender). Plural-Artikel immer die. Lernen Sie den Plural mit!",
    ru: "Пять типов мн. числа: -(e)n (Briefmarken), -e/¨e (Stifte, Schränke), -s (Sofas), -er/¨er (Bilder, Bücher), без окончания (Kalender). Артикль мн. числа всегда die. Учите форму мн. числа вместе со словом!",
    ex: ["die Rechnung – die Rechnungen", "das Handy – die Handys", "das Buch – die Bücher"]
  },
  "akkusativ": {
    t: "Akkusativ · Винительный падеж",
    de: "Nach Verben wie haben, brauchen, suchen, finden steht der Akkusativ. Nur maskulin ändert sich: der → den, ein → einen, kein → keinen. das, die, Plural bleiben gleich.",
    ru: "После глаголов haben, brauchen, suchen, finden ставится винительный падеж. Меняется только мужской род: der → den, ein → einen, kein → keinen. das, die и мн. ч. не меняются.",
    ex: ["Ich brauche einen Drucker.", "Er hat keinen Laptop.", "Ich finde den Tisch schön."]
  },
  "ue": {
    t: "Der Vokal ü",
    de: "ü: Lippen rund wie bei u, Zunge wie bei i. ü kann lang (grün, Stühle) oder kurz (fünf, Schlüssel) sein.",
    ru: "ü: губы округлены, как при «у», язык — как при «и» (похоже на «ю» без «й»). ü бывает долгим (grün, Stühle) и кратким (fünf, Schlüssel).",
    ex: ["lang: Büro, grün, Grüße", "kurz: fünf, Schlüssel"]
  },
  "koennen": {
    t: "Modalverb können",
    de: "ich kann, du kannst, er/sie kann, wir können, ihr könnt, sie/Sie können. ich und er/sie haben keine Endung!",
    ru: "ich kann, du kannst, er/sie kann, wir können, ihr könnt, sie/Sie können. У ich и er/sie нет окончания!",
    ex: ["Ich kann gut kochen.", "Kannst du schwimmen?"]
  },
  "satzklammer": {
    t: "Satzklammer · Рамочная конструкция",
    de: "Modalverb (können, möchten) auf Position 2, der Infinitiv am Satzende. So entsteht eine „Klammer“.",
    ru: "Модальный глагол (können, möchten) стоит на 2-м месте, а смысловой глагол в инфинитиве — в самом конце. Получается «рамка».",
    ex: ["Du kannst wirklich sehr gut tanzen.", "Ich möchte etwas essen."]
  },
  "vokalwechsel-a": {
    t: "Vokalwechsel a → ä, e → ie / i",
    de: "Bei manchen Verben ändert sich der Vokal bei du und er/sie: fahren → du fährst; lesen → du liest; treffen → du triffst; essen → du isst.",
    ru: "У некоторых глаголов гласная меняется в формах du и er/sie: fahren → du fährst; lesen → du liest; treffen → du triffst; essen → du isst.",
    ex: ["Er fährt gern Rad.", "Sie liest oft.", "Er trifft Freunde."]
  },
  "haeufigkeit": {
    t: "Wie oft? · Как часто?",
    de: "immer (100 %) → fast immer → oft → manchmal → nie (0 %).",
    ru: "immer (всегда, 100 %) → fast immer (почти всегда) → oft (часто) → manchmal (иногда) → nie (никогда, 0 %).",
    ex: ["Ich gehe oft ins Kino.", "Ich rauche nie."]
  },
  "akzent-wandernd": {
    t: "Wandernder Satzakzent",
    de: "Der Satzakzent „wandert“ zur wichtigsten Information des Satzes.",
    ru: "Фразовое ударение «переходит» на самую важную информацию в предложении.",
    ex: ["Ich kann SCHACH spielen.", "Ich kann GUT Schach spielen.", "Ich kann SEHR gut Schach spielen."]
  },
  "inversion": {
    t: "Inversion · Обратный порядок слов",
    de: "Auf Position 1 kann auch eine Zeit- oder Ortsangabe stehen. Das Verb bleibt auf Position 2, das Subjekt kommt nach dem Verb.",
    ru: "На 1-м месте может стоять обстоятельство времени или места. Глагол остаётся на 2-м месте, а подлежащее переходит за глагол.",
    ex: ["Heute kann ich nicht.", "Am Wochenende habe ich Zeit.", "Leider habe ich keine Zeit."]
  },
  "uhrzeit": {
    t: "Uhrzeit · Время",
    de: "Offiziell (Radio, Bahnhof): neun Uhr fünfundfünfzig (9:55), vierzehn Uhr dreißig. Im Gespräch: fünf vor zehn, halb drei (2:30!), Viertel nach sieben, Viertel vor acht.",
    ru: "Официально (радио, вокзал): neun Uhr fünfundfünfzig (9:55), vierzehn Uhr dreißig. В разговоре: fünf vor zehn (без пяти десять), halb drei (= 2:30! «половина третьего»), Viertel nach sieben (четверть восьмого), Viertel vor acht (без четверти восемь).",
    ex: ["Es ist halb drei.", "Es ist Viertel nach sieben.", "Wie spät ist es?"]
  },
  "am-um": {
    t: "Zeitangaben: am, um, in der",
    de: "am + Wochentag / Tageszeit (am Montag, am Abend). um + Uhrzeit (um drei Uhr). Aber: in der Nacht.",
    ru: "am + день недели / часть дня (am Montag, am Abend). um + время по часам (um drei Uhr). Но: in der Nacht (ночью).",
    ex: ["Am Montag um acht Uhr.", "Am Nachmittag trifft sie ihre Oma.", "Er arbeitet in der Nacht."]
  },
  "e-unbetont": {
    t: "Unbetontes „e“",
    de: "In betonten Silben hört man das e deutlich (Essen). In unbetonten Silben (-en, -el, -er) hört man es kaum (Viertel, gehen).",
    ru: "В ударном слоге e слышно чётко (Essen). В безударном (-en, -el, -er) оно почти не слышно (Viertel, gehen).",
    ex: ["Morgen", "Abend", "sieben"]
  },
  "moegen": {
    t: "mögen und essen",
    de: "mögen: ich mag, du magst, er mag, wir mögen, ihr mögt, sie/Sie mögen. essen: ich esse, du isst, er isst (e → i).",
    ru: "mögen («любить, нравиться»): ich mag, du magst, er mag, wir mögen, ihr mögt, sie/Sie mögen. essen: ich esse, du isst, er isst (e → i).",
    ex: ["Ich mag Fisch.", "Isst du gern Kuchen?"]
  },
  "moechte": {
    t: "möchte (höflicher Wunsch)",
    de: "ich möchte, du möchtest, er/sie möchte, wir möchten, ihr möchtet, sie/Sie möchten. Mit Infinitiv: Satzklammer.",
    ru: "Вежливое «хотел(а) бы»: ich möchte, du möchtest, er/sie möchte, wir möchten, ihr möchtet, sie/Sie möchten. С инфинитивом — рамочная конструкция.",
    ex: ["Ich möchte einen Kaffee.", "Was möchtest du essen?"]
  },
  "komposita": {
    t: "Komposita · Сложные слова",
    de: "Zwei Nomen werden ein Wort. Der Artikel kommt vom letzten Wort: das Obst + der Salat = der Obstsalat. Der Akzent liegt auf dem ersten Wort: OBSTsalat.",
    ru: "Два существительных сливаются в одно слово. Артикль берётся от последнего: das Obst + der Salat = der Obstsalat. Ударение — на первой части: OBSTsalat.",
    ex: ["der Kartoffelsalat", "das Käsebrötchen", "die Zwiebelsuppe"]
  },
  "schon-erst": {
    t: "schon oder erst?",
    de: "schon: früher / mehr als erwartet. erst: später / weniger als erwartet.",
    ru: "schon — «уже» (раньше или больше, чем ожидали). erst — «только ещё / лишь» (позже или меньше, чем ожидали).",
    ex: ["Es ist schon elf Uhr!", "Es ist erst fünf Uhr."]
  },
  "trennbar": {
    t: "Trennbare Verben · Отделяемые приставки",
    de: "Die Vorsilbe (an-, ab-, ein-, aus-, um-, mit-, fern-, auf-) geht ans Satzende. Das Verb steht auf Position 2.",
    ru: "Приставка (an-, ab-, ein-, aus-, um-, mit-, fern-, auf-) отделяется и уходит в конец предложения. Глагол остаётся на 2-м месте.",
    ex: ["Ich rufe dich an. (anrufen)", "Wir steigen am Rathausplatz aus. (aussteigen)", "Vielleicht kaufe ich noch was ein."]
  },
  "akzent-trennbar": {
    t: "Wortakzent bei trennbaren Verben",
    de: "Der Akzent liegt immer auf der trennbaren Vorsilbe: ANkommen, EINkaufen, FERNsehen.",
    ru: "Ударение всегда падает на отделяемую приставку: ANkommen, EINkaufen, FERNsehen.",
    ex: ["abfahren", "ankommen", "mitbringen"]
  },
  "zeit-ab-bis": {
    t: "von … bis, ab",
    de: "von … bis: Anfang und Ende (von 9 bis 17 Uhr). ab: nur der Anfang (ab 8 Uhr).",
    ru: "von … bis — начало и конец («с … до …»: von 9 bis 17 Uhr). ab — только начало («с …»: ab 8 Uhr).",
    ex: ["Von 18 bis 19 Uhr kauft sie ein.", "Ab 8 Uhr arbeitet sie."]
  },
  "perfekt-haben": {
    t: "Perfekt mit haben · Прошедшее время",
    de: "haben (Position 2) + Partizip II (Satzende). Regelmäßig: ge…t (gemacht). Unregelmäßig: ge…en (geschrieben). Trennbar: auf-ge-räumt. Verben auf -ieren: ohne ge (telefoniert).",
    ru: "haben (на 2-м месте) + Partizip II (в конце). Правильные глаголы: ge…t (gemacht). Неправильные: ge…en (geschrieben) — учить наизусть. С отделяемой приставкой: auf-ge-räumt. Глаголы на -ieren — без ge (telefoniert).",
    ex: ["Ich habe lange geschlafen.", "Hast du schon eingekauft?", "Wir haben Kuchen gegessen."]
  },
  "perfekt-sein": {
    t: "Perfekt mit sein",
    de: "Verben der Bewegung von A nach B (gehen, fahren, fliegen, kommen, einsteigen …) bilden das Perfekt mit sein.",
    ru: "Глаголы движения из точки А в точку Б (gehen, fahren, fliegen, kommen, einsteigen …) образуют Perfekt с sein.",
    ex: ["Ich bin nach Hamburg gefahren.", "Der Zug ist abgefahren.", "Sie ist nach Genf geflogen."]
  },
  "war-hatte": {
    t: "war und hatte (Präteritum)",
    de: "Bei sein und haben benutzt man für die Vergangenheit meist war und hatte: ich war, du warst, er war; ich hatte, du hattest, er hatte.",
    ru: "Для прошедшего времени sein и haben обычно используют формы war и hatte: ich war, du warst, er war; ich hatte, du hattest, er hatte.",
    ex: ["Gestern war ich im Kino.", "Ich hatte kein Geld."]
  },
  "jahreszahlen": {
    t: "Jahreszahlen und Monate",
    de: "Bis 1999 liest man Hunderter: 1966 = neunzehnhundertsechsundsechzig. Ab 2000: zweitausend(eins). im + Monat / Jahreszeit: im Mai, im Winter.",
    ru: "До 1999 года читают сотнями: 1966 = neunzehnhundertsechsundsechzig («девятнадцать сотен шестьдесят шесть»). С 2000: zweitausend(eins). im + месяц / время года: im Mai, im Winter.",
    ex: ["neunzehnhundertsechsundsechzig", "zweitausendeins", "Ich habe im Mai Geburtstag."]
  },
  "aus-in-nach": {
    t: "aus, in oder nach?",
    de: "aus = Herkunft (Woher?). in = Ort (Wo?). nach = Richtung zu Städten/Ländern ohne Artikel (Wohin?). Mit Artikel: in die Schweiz, aus der Schweiz.",
    ru: "aus — откуда (происхождение). in — где (место). nach — куда (в город/страну без артикля). Со странами с артиклем: in die Schweiz, aus der Schweiz.",
    ex: ["Er kommt aus Paris.", "Sie wohnen in Berlin.", "Sie ist nach Genf geflogen."]
  },
  "r-vokalisch": {
    t: "Vokalisches „r“",
    de: "Am Wortanfang und nach Konsonant hört man r (Reise, Straße, Freund). Nach Vokal und in -er klingt r wie ein kurzes a (Bier, Silvester, Besucher).",
    ru: "В начале слова и после согласной r слышно (Reise, Straße, Freund). После гласной и в окончании -er r звучит как короткое «а» (Bier ≈ «би:а», Silvester ≈ «зильвеста»).",
    ex: ["Reise", "Bier", "Silvester"]
  },
  "akzent-perfekt": {
    t: "Satzakzent in Sätzen mit Perfekt",
    de: "Im Perfekt-Satz liegt der Akzent meist auf der wichtigen Information, oft direkt vor dem Partizip oder auf dem Partizip.",
    ru: "В предложении в Perfekt ударение обычно падает на важную информацию — часто на слово перед причастием или на само причастие.",
    ex: ["Ich habe lange geSCHLAfen.", "Wir haben PIZza gegessen."]
  }
};
