# Finance Tracker

React + Vite → REST API (Express) → SQLite. Данные реально хранятся в БД, вся статистика считается на сервере.

## Требования
Node.js 18+ (проверено на 20/22).

## Запуск
```bash
npm run install:all   # зависимости root + server + client
npm run seed          # создаёт БД (server/db/finance.db) и наполняет demo-данными
npm run dev           # API :3001 + клиент :5173
```
Открыть http://localhost:5173. По отдельности: `npm run dev --prefix server`, `npm run dev --prefix client`.
Таблицы создаются автоматически при первом запуске сервера; `seed` можно запускать повторно (пересоздаёт демо-данные).

## Переменные окружения
`server/.env` (шаблон `server/.env.example`): `PORT`, `DB_FILE`, `CLIENT_ORIGIN`.
`client/.env` (необязательно): `VITE_API_URL` (по умолчанию `/api`, проксируется Vite на :3001).

## Схема БД
users, categories, transactions, budgets, goals, subscriptions, settings (см. `server/db/db.js`).
Все пользовательские таблицы связаны с `users` через `user_id` (пока один demo-user).

## API (`/api`)
| Метод | Путь | Описание |
|---|---|---|
| GET | `/transactions?type&category&q&month&from&to&sort&dir` | список с фильтрами |
| POST/PUT/DELETE | `/transactions[/:id]` | создать / изменить / удалить |
| GET/POST | `/income`, `/expenses` | то же, но только доходы / расходы |
| GET/POST/PUT/DELETE | `/budgets[/:id]` | GET возвращает spent / remaining / status за месяц (`?month=YYYY-MM`) |
| GET/POST/PUT/DELETE | `/goals[/:id]` | цели |
| GET/POST/PUT/DELETE | `/subscriptions[/:id]` | подписки (+ `monthly_cost`) |
| GET | `/dashboard` | баланс, доходы/расходы, savings rate, графики, health score |
| GET/PUT | `/settings` | основная валюта (USD/EUR/GBP/RUB) |
| GET | `/categories` | справочник категорий |

Формулы: `Balance = Income − Expenses`, `Savings Rate = (Income − Expenses) / Income × 100`, `Remaining = Limit − Spent`.

## Структура
```
server/  db/ (схема, seed)  routes/ (crud.js, index.js)  services/finance.js  server.js
client/src/  components/  pages/  hooks/  api.js  context.js  App.jsx
```
