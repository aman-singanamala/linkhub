# Social Bookmarking Platform (Microservices)

This workspace is a starter setup based on the architecture in `Social Bookmarking Microservices Architecture.pdf`. It provides a practical skeleton you can extend without locking you into implementation details too early.

## Services
- `api-gateway` (Spring Cloud Gateway)
- `auth-service` (login/register, JWT/refresh, role mgmt)
- `user-service` (profiles, follow/unfollow, stats)
- `bookmark-service` (CRUD bookmarks, topics/tags, comments/upvotes, trending)
- `notification-service` (Kafka consumer + WebSocket push)

## Shared Infrastructure
- Postgres (separate DBs per service)
- Redis (caching/trending)
- Kafka + Zookeeper (event communication)

## Quick Start
0. Configure backend env (from repo root):
   ```bash
   cp .env.example .env
   export APP_JWT_SECRET=replace-with-strong-secret-32+chars
   export APP_GOOGLE_CLIENT_ID=your-google-client-id
   export APP_GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```
1. Start everything (recommended):
   ```bash
   ./scripts/dev.sh
   ```
2. View logs:
   ```bash
   ./scripts/logs.sh
   ```
3. Stop everything:
   ```bash
   ./scripts/stop.sh
   ```

If you prefer manual control:
1. Start infra:
   ```bash
   docker compose up -d
   ```
2. Build a service (repeat per service folder):
   ```bash
   mvn -q -DskipTests package
   ```
3. Run a service (repeat per service folder):
   ```bash
   mvn spring-boot:run
   ```

## Supabase (Dev DB)
Supabase provides a single Postgres database, so the services use separate schemas.

1. In Supabase SQL Editor, run:
   ```sql
   create schema if not exists app_auth;
   create schema if not exists app_users;
   create schema if not exists app_bookmarks;
   create schema if not exists app_notifications;
   ```
   (Avoid `auth` schema name since Supabase reserves it.)
2. Create a Supabase env file:
   ```bash
   cp .env.example .env.supabase
   ```
   Fill in:
   - `SUPABASE_JDBC_URL` (use `?sslmode=require`)
   - `SUPABASE_DB_USER`
   - `SUPABASE_DB_PASSWORD`
   - `SPRING_PROFILES_ACTIVE=supabase`
3. Start with Supabase env:
   ```bash
   ENV_FILE=.env.supabase ./scripts/dev.sh
   ```
   (This still starts local Redis/Kafka. The DB will be Supabase.)

## Frontend (React)
1. From `frontend/`:
   ```bash
   npm install
   cp .env.example .env
   npm run dev
   ```
2. Open `http://localhost:5173`.
3. The app proxies `/api/*` to the API Gateway on `http://localhost:8080`.

## Ports (default)
- Gateway: `8080`
- Auth: `8081`
- User: `8082`
- Bookmark: `8083`
- Notification: `8084`

## DBs
`infra/postgres/init.sql` creates:
- `auth_db`
- `user_db`
- `bookmark_db`
- `notification_db`

## Events (Kafka)
Event placeholders live in `shared/events/`.

## Bookmark APIs
See `docs/bookmark-service.md` for endpoints, auth rules, and schema.

## Notes
- Each service owns its data and communicates via REST or Kafka.
- WebSocket endpoint is stubbed in `notification-service` for real-time updates.
- Gateway includes a placeholder route config you can extend.

## Next Steps
- Confirm tech choices (Spring Boot version, JWT library, DB migrations).
- Define schemas and event contracts.
- Implement API endpoints and security flows.
