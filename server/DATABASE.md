# База данных HappyHome (MongoDB)

Сервер хранит данные в MongoDB через Mongoose. Миграции не нужны: коллекции и индексы создаются автоматически
при первом запуске сервера (или командой `npm run db:init`). Достаточно, чтобы MongoDB была запущена
и в `server/.env` был верный `MONGO_URI`.

## Выберите вариант

| Вариант | Когда подходит | `MONGO_URI` |
|---|---|---|
| **A. Docker** (рекомендуется для разработки) | Docker Desktop установлен | `mongodb://localhost:27017/happyhome` |
| **B. Homebrew** | Docker не нужен, macOS | `mongodb://localhost:27017/happyhome` |
| **C. MongoDB Atlas** | облачная база, удобна для удалённого сервера | `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/happyhome?retryWrites=true&w=majority` |
| **D. База на своём сервере** (production) | сервер на VPS | задаётся в `docker-compose.prod.yml` автоматически |

## A. Docker

```bash
cd server
docker compose up -d db          # только база; сервер запускайте через npm run dev
docker compose ps                # статус db должен стать "healthy"
```

База слушает `127.0.0.1:27017` (снаружи недоступна), данные лежат в томе `mongo-data` и сохраняются при перезапуске.
Остановить: `docker compose stop db`. Удалить вместе с данными: `docker compose down -v`.

## B. Homebrew (macOS)

```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

## C. MongoDB Atlas (облако)

1. Зарегистрируйтесь на https://www.mongodb.com/cloud/atlas и создайте бесплатный кластер (план M0).
2. **Database Access → Add New Database User**: придумайте логин и пароль, роль «Read and write to any database».
   Пароль лучше из букв и цифр; спецсимволы в нём придётся кодировать (`@` → `%40`).
3. **Network Access → Add IP Address**: добавьте IP вашего сервера. Для проверки с домашнего компьютера можно
   временно разрешить доступ отовсюду (`0.0.0.0/0`), но в рабочем режиме это небезопасно.
4. **Connect → Drivers**: скопируйте строку подключения и **добавьте имя базы** перед `?`:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/happyhome?retryWrites=true&w=majority`.
5. Вставьте её в `MONGO_URI` в `server/.env`.

## D. База на своём сервере (production)

`docker-compose.prod.yml` поднимает сервер и MongoDB **с паролем**; порт базы наружу не публикуется.

1. В `.env` рядом с `docker-compose.prod.yml` задайте `MONGO_USER` и `MONGO_PASSWORD`
   (пароль из букв и цифр, например `openssl rand -hex 16`) и остальные переменные из `.env.example`.
2. `docker compose -f docker-compose.prod.yml up -d`.

Учётная запись создаётся только при первом запуске с **пустым** томом. Если том уже создавался без пароля,
смена переменных ничего не изменит: сначала удалите том (`docker compose -f docker-compose.prod.yml down -v`,
**все данные пропадут**).

## Проверка

```bash
cd server
cp .env.example .env     # если ещё не сделали, и заполните значения
npm install
npm run db:check         # подключение, версия MongoDB, коллекции и индексы
npm run db:init          # то же + создаёт коллекции и индексы заранее
```

Успешный `db:check` печатает «Подключение успешно». При ошибке пароль в строке подключения скрывается звёздочками.
Типичные причины: MongoDB не запущена (`ECONNREFUSED`), неверный логин или пароль (`Authentication failed`),
IP не добавлен в Network Access в Atlas (`Server selection timed out`).

## Демо-данные

```bash
npm run db:seed
```

Создаёт двух подтверждённых пользователей (`demo@happyhome.local`, `demo2@happyhome.local`, пароль `demo1234`),
семью и примеры в трёх модулях: просроченные и истекающие лекарства, растения с разным статусом полива,
покупки с повтором. Выводит идентификатор семьи, по которому можно присоединиться вторым аккаунтом.
Повторный запуск пересоздаёт демо-данные. В production скрипт отказывается работать (нужен флаг `--force`).

## Структура данных

| Коллекция | Поля | Индексы |
|---|---|---|
| `users` | email, password (хеш), name, family_id, isVerified, emailToken, verificationSentAt | `email` (уникальный), `family_id`, `emailToken` |
| `families` | name, owner_id → `users` | — |
| `pills` | name, description, quantity, expiresAt, createdAt, createdBy, family_id | `family_id` |
| `plants` | name, description, waterFrequency, lastWateredAt, createdAt, createdBy, family_id, careHistory[] | `family_id` |
| `shoppings` | name, category, quantity, buyByDate, frequency, bought, boughtAt, createdAt, createdBy, family_id | `family_id` |

Связи: пользователь входит в одну семью (`users.family_id → families._id`); лекарства, растения и покупки
принадлежат семье (`family_id`) и хранят автора (`createdBy → users._id`). История полива растения хранится
вложенным массивом `careHistory` (`note`, `createdAt`, `createdBy`). Все запросы к данным фильтруются по
`family_id` пользователя, поэтому индекс по этому полю есть у каждой коллекции данных.

## Резервная копия

Docker (локально):

```bash
docker compose exec -T db mongodump --db happyhome --archive --gzip > backup.gz
docker compose exec -T db mongorestore --archive --gzip --drop < backup.gz
```

Production (с паролем):

```bash
docker compose -f docker-compose.prod.yml exec -T db sh -c \
  'mongodump -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --db happyhome --archive --gzip' > backup.gz
```

Просмотреть данные глазами можно в MongoDB Compass (https://www.mongodb.com/products/compass): подключитесь по тому же `MONGO_URI`.
