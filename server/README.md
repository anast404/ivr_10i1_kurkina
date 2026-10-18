# HappyHome — сервер

Express + TypeScript + MongoDB (Mongoose). Авторизация по JWT, подтверждение почты по ссылке из письма.

## Быстрый старт

```bash
cd server
cp .env.example .env     # заполните значения
docker run -d -p 27017:27017 mongo:7   # или docker compose up db
npm install
npm run dev              # http://localhost:5000/api/health
```

Подробнее про базу (Docker, Homebrew, Atlas, production, резервные копии, демо-данные): [DATABASE.md](DATABASE.md).

Если `EMAIL_USER`/`EMAIL_PASS` не заданы, ссылка подтверждения печатается в консоль сервера.

## Переменные окружения

| Переменная | Назначение |
|---|---|
| `MONGO_URI` | строка подключения к MongoDB |
| `MONGO_USER`, `MONGO_PASSWORD` | учётная запись MongoDB (только для `docker-compose.prod.yml`) |
| `JWT_SECRET` | секрет подписи токенов (длинная случайная строка) |
| `JWT_EXPIRES_IN` | срок жизни токена, по умолчанию `30d` |
| `EMAIL_USER`, `EMAIL_PASS` | Gmail и «пароль приложения» для писем |
| `BASE_URL` | адрес сервера, доступный с телефона (ссылка в письме) |
| `PORT` | порт, по умолчанию `5000` |
| `TRUST_PROXY` | число прокси перед сервером (для лимита запросов по реальному IP) |
| `AUTH_RATE_LIMIT_MAX` | лимит запросов к `/api/auth` с одного IP за 15 минут (по умолчанию 50) |

## Скрипты

| Команда | Что делает |
|---|---|
| `npm run dev` | запуск с перезагрузкой (tsx) |
| `npm run typecheck` | проверка типов кода и тестов |
| `npm test` | модульные и интеграционные тесты (нужна MongoDB, база `happyhome_test` очищается) |
| `npm run build` / `npm start` | сборка в `dist/` и запуск |
| `npm run db:check` / `npm run db:init` | проверка подключения к базе / создание коллекций и индексов |
| `npm run db:seed` | демо-данные для разработки и защиты |

## API

Префикс `/api`. Токен передаётся в заголовке `Authorization` (допустим и формат `Bearer <token>`).
Все маршруты данных требуют подтверждённой почты и принадлежности к семье.

| Маршрут | Метод | Назначение |
|---|---|---|
| `/auth/register` | POST | регистрация, возвращает `token` и отправляет письмо |
| `/auth/verify/:token` | GET | подтверждение почты (HTML-страница) |
| `/auth/login` | POST | вход, возвращает `token` |
| `/auth/resend` | POST | повторная отправка письма (не чаще раза в минуту) |
| `/user` | GET | профиль (доступен без подтверждённой почты) |
| `/user/update` | PUT | имя / вступление в семью по `family_id` |
| `/user/leave-family` | DELETE | выход из семьи |
| `/family/create` | POST | создать семью |
| `/family?id=` | GET | своя семья |
| `/family/members` | GET | участники семьи |
| `/pill`, `/pill/create`, `/pill/update`, `/pill/:id` | GET / POST / POST / DELETE | аптечка |
| `/plant`, `/plant/create`, `/plant/:id`, `/plant/:id/care`, `/plant/:id` | GET / POST / PUT / PUT / DELETE | растения, полив |
| `/shopping`, `/shopping/create`, `/shopping/:id`, `/shopping/:id/bought`, `/shopping/:id` | GET / POST / PUT / PUT / DELETE | покупки; «куплено» создаёт следующую повторяющуюся покупку |

Ошибки возвращаются как `{ "message": "..." }` с кодами 400 (данные), 401 (токен), 403 (почта не подтверждена / чужая семья), 404, 429 (лимиты).

Правила жизненного цикла семьи: при выходе владельца владение переходит старейшему участнику;
когда выходит последний участник, семья и все её данные удаляются.

## CI/CD

- `.github/workflows/ci.yml` — на каждый push и pull request: проверка типов и тесты с MongoDB в service-контейнере.
- `.github/workflows/deploy.yml` — на push в `main`: сборка `server/Dockerfile.prod`, публикация образа в GHCR
  и обновление контейнеров на сервере по SSH.

Для деплоя на свой сервер:

1. На сервере установите Docker, создайте папку, положите туда `docker-compose.prod.yml` и `.env` (по `.env.example`).
2. В репозитории: *Settings → Secrets and variables → Actions* — добавьте
   `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` (приватный ключ), `DEPLOY_PATH` (папка из п. 1),
   `GHCR_TOKEN` (personal access token со scope `read:packages`; не нужен, если пакет публичный).
3. Если у ссылки в письме и у приложения другой адрес, укажите его в `BASE_URL` и `EXPO_PUBLIC_API_URL`.
