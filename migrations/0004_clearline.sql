-- Extend the trusted account scaffold; preserve its numeric user identifiers.
CREATE TABLE auth_identities (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider = 'google'),
    provider_subject TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(provider, provider_subject),
    UNIQUE(user_id, provider)
);

CREATE TABLE contact_messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
    email TEXT NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
    message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 5000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Existing sessions are expired once as storage changes to SHA-256 digests.
DELETE FROM sessions;
