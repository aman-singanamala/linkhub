# Bookmark Service API + Schema

## Database Design (Postgres)

Table: `bookmarks`
- `id` UUID PK
- `owner_id` UUID (user id from JWT `sub`)
- `owner_name` VARCHAR
- `owner_username` VARCHAR
- `owner_avatar_url` VARCHAR NULL
- `title` VARCHAR(140)
- `url` VARCHAR(2048)
- `description` TEXT
- `visibility` VARCHAR (PUBLIC | PRIVATE)
- `saved_count` INT
- `shared_count` INT
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

Table: `bookmark_tags`
- `bookmark_id` UUID FK → `bookmarks.id`
- `tag` VARCHAR(40)

Table: `bookmark_saves`
- `id` UUID PK
- `bookmark_id` UUID FK → `bookmarks.id`
- `user_id` UUID (from JWT `sub`)
- `created_at` TIMESTAMP
- Unique: (`bookmark_id`, `user_id`)

Table: `bookmark_shares`
- `id` UUID PK
- `bookmark_id` UUID FK → `bookmarks.id`
- `user_id` UUID (from JWT `sub`)
- `created_at` TIMESTAMP
- Unique: (`bookmark_id`, `user_id`)

Notes
- Tags are stored as a separate collection table for fast lookup and filtering.
- `owner_*` is denormalized for display, sourced from the JWT at creation time.
- Saves/shares are idempotent per user (no double counts).

## API Endpoints

Public
- `GET /bookmarks?page=0&size=20&tag=design` → list public bookmarks
- `GET /bookmarks/{id}` → get bookmark details (private requires owner/admin)
- `GET /bookmarks/users/{username}` → list public bookmarks by username
- `GET /bookmarks/health`

Authenticated
- `GET /bookmarks/me` → list my bookmarks
- `GET /bookmarks/saved` → list bookmarks I saved
- `POST /bookmarks` → create
- `PUT /bookmarks/{id}` → update (owner or admin)
- `DELETE /bookmarks/{id}` → delete (owner or admin)
- `POST /bookmarks/{id}/save` → increment saved count
- `DELETE /bookmarks/{id}/save` → unsave (decrement if exists)
- `POST /bookmarks/{id}/share` → increment share count
- `DELETE /bookmarks/{id}/share` → unshare (decrement if exists)

## Authorization Rules
- Create/update/delete require JWT.
- Only the bookmark owner can edit/delete.
- `ROLE_ADMIN` can edit/delete any bookmark.
