-- Pre-embedded features: file uploads (uploads.go) and in-app notifications
-- (notifications.go). Both ship working in the starter; the tables stay empty
-- for apps that don't use them.

-- One row per file stored on local disk. `stored_name` is the server-generated
-- filename (never the client's) and is what /api/uploads/{name} serves.
CREATE TABLE IF NOT EXISTS uploads (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stored_name   TEXT NOT NULL UNIQUE,
    original_name TEXT NOT NULL DEFAULT '',
    content_type  TEXT NOT NULL DEFAULT '',
    byte_size     BIGINT NOT NULL DEFAULT 0,
    inserted_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uploads_user ON uploads(user_id);

-- In-app notifications, one row per user per event. `type` is a free-form tag
-- ("info", "success", …) the UI maps to a Badge variant; `url` is where clicking
-- the notification should go; `read_at` is NULL until read.
CREATE TABLE IF NOT EXISTS notifications (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    body        TEXT NOT NULL DEFAULT '',
    type        TEXT NOT NULL DEFAULT 'info',
    url         TEXT NOT NULL DEFAULT '',
    read_at     TIMESTAMPTZ,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read_at);
