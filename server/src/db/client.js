import pg from 'pg';

const { Pool } = pg;

let pool;

export async function initDB() {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query('SELECT 1');
  console.log('✅  PostgreSQL connected');
  await runMigrations();
}

export function db() {
  if (!pool) throw new Error('DB not initialised');
  return pool;
}

async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name          TEXT NOT NULL,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      ghost_score   INTEGER NOT NULL DEFAULT 50,
      is_suspended  BOOLEAN NOT NULL DEFAULT FALSE,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS groups (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name            TEXT NOT NULL,
      description     TEXT,
      template        TEXT NOT NULL DEFAULT 'general',
      creator_id      UUID NOT NULL REFERENCES users(id),
      lat             DOUBLE PRECISION NOT NULL,
      lng             DOUBLE PRECISION NOT NULL,
      neighborhood    TEXT NOT NULL,
      radius_km       FLOAT NOT NULL DEFAULT 1.0,
      max_members     INTEGER NOT NULL DEFAULT 40,
      lifetime_hours  INTEGER NOT NULL DEFAULT 24,
      min_ghost_score INTEGER NOT NULL DEFAULT 0,
      silence_start   INTEGER,
      silence_end     INTEGER,
      is_alert        BOOLEAN NOT NULL DEFAULT FALSE,
      health_score    FLOAT NOT NULL DEFAULT 100.0,
      member_count    INTEGER NOT NULL DEFAULT 1,
      expires_at      TIMESTAMPTZ NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS group_members (
  group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  anon_name   TEXT NOT NULL DEFAULT 'Anonymous',
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_creator  BOOLEAN NOT NULL DEFAULT FALSE,
  is_kicked   BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (group_id, user_id)
);

    CREATE TABLE IF NOT EXISTS join_requests (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      user_id     UUID NOT NULL REFERENCES users(id),
      reason      TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pending',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (group_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      user_id     UUID NOT NULL REFERENCES users(id),
      content     TEXT NOT NULL,
      flag_count  INTEGER NOT NULL DEFAULT 0,
      is_hidden   BOOLEAN NOT NULL DEFAULT FALSE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS messages_group_id ON messages(group_id, created_at);

    CREATE TABLE IF NOT EXISTS message_flags (
      message_id  UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      user_id     UUID NOT NULL REFERENCES users(id),
      PRIMARY KEY (message_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS place_tips (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lat           DOUBLE PRECISION NOT NULL,
      lng           DOUBLE PRECISION NOT NULL,
      neighborhood  TEXT NOT NULL,
      content       TEXT NOT NULL,
      upvotes       INTEGER NOT NULL DEFAULT 0,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ghost_events (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID NOT NULL REFERENCES users(id),
      delta       INTEGER NOT NULL,
      reason      TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✅  Migrations applied');
}