import db from "./database.js";
console.log("INIT DATABASE RUNNING");

const initDatabase = db.transaction(() => {

db.exec(`

-- Permanent player profiles (long-term database)
CREATE TABLE IF NOT EXISTS player_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'Beginner',
    contact_info TEXT DEFAULT '',
    doubles_category TEXT DEFAULT 'No Gender Preference',
    -- Men's Doubles | Women's Doubles | Mixed Doubles | No Gender Preference
    preferred_level TEXT DEFAULT '',
    preferred_mode TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Daily registration table (today's registered players)
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,

    level TEXT NOT NULL DEFAULT 'Beginner',

    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,

    status TEXT DEFAULT 'waiting',
    -- waiting | playing | finished

doubles_category TEXT DEFAULT 'No Gender Preference',
    registration_date TEXT DEFAULT CURRENT_DATE,
    profile_id INTEGER REFERENCES player_profiles(id) ON DELETE SET NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS courts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    position INTEGER,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    court_id INTEGER,
    player_one INTEGER NOT NULL,
    player_two INTEGER NOT NULL,
    match_type TEXT DEFAULT 'singles',
    start_time DATETIME,
    end_time DATETIME,
    status TEXT DEFAULT 'playing',
    winner_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS match_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_one INTEGER NOT NULL,
    player_two INTEGER NOT NULL,
    match_type TEXT DEFAULT 'singles',
    played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    winner_id INTEGER
);


CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE,
    value TEXT
);


CREATE TABLE IF NOT EXISTS round_robin_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_one_id INTEGER NOT NULL,
    player_two_id INTEGER NOT NULL,
    match_type TEXT DEFAULT 'singles',
    status TEXT DEFAULT 'pending',
    court_id INTEGER,
    round_number INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_one_id) REFERENCES players(id),
    FOREIGN KEY (player_two_id) REFERENCES players(id),
    FOREIGN KEY (court_id) REFERENCES courts(id)
);


-- Normalized join table for match participants (supports both singles and doubles)
CREATE TABLE IF NOT EXISTS match_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    team INTEGER,
    -- 1 or 2 for doubles, NULL for singles
    match_type TEXT NOT NULL DEFAULT 'singles',
    -- 'singles' | 'doubles'
    source TEXT NOT NULL DEFAULT 'normal',
    -- 'normal' | 'round_robin' | 'history'
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

`);

});


initDatabase();


// ---- MIGRATION: populate match_players from existing data ----

const migration = db.transaction(() => {
  // Check if we've already run the migration
  const schemaVersion = db.prepare(
    `SELECT value FROM settings WHERE key = 'schema_version'`
  ).get();

  if (schemaVersion) {
    console.log("Schema already at version:", schemaVersion.value);
    return;
  }

  // Add match_type columns to existing tables if they don't exist (for databases created before this change)
  const tableInfo = db.prepare(`PRAGMA table_info(matches)`).all();
  const hasMatchType = tableInfo.some((col) => col.name === "match_type");
  if (!hasMatchType) {
    db.prepare(`ALTER TABLE matches ADD COLUMN match_type TEXT DEFAULT 'singles'`).run();
    db.prepare(`ALTER TABLE match_history ADD COLUMN match_type TEXT DEFAULT 'singles'`).run();
    db.prepare(`ALTER TABLE round_robin_matches ADD COLUMN match_type TEXT DEFAULT 'singles'`).run();
  }

  // Check if match_players is empty (newly created) and old tables have data
  const matchPlayersCount = db.prepare(`SELECT COUNT(*) as cnt FROM match_players`).get().cnt;
  if (matchPlayersCount > 0) {
    // Already migrated
    db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('schema_version', '2')`).run();
    return;
  }

  // Migrate matches table
  const matches = db.prepare(`SELECT id, player_one, player_two, match_type FROM matches`).all();
  const insertMP = db.prepare(`
    INSERT INTO match_players (match_id, player_id, team, match_type, source)
    VALUES (?, ?, ?, ?, 'normal')
  `);
  for (const match of matches) {
    const mt = match.match_type || 'singles';
    const team = mt === 'doubles' ? 1 : null;
    insertMP.run(match.id, match.player_one, team, mt);
    insertMP.run(match.id, match.player_two, mt === 'doubles' ? 2 : null, mt);
  }

  // Migrate match_history table
  const historyEntries = db.prepare(`SELECT id, player_one, player_two, match_type FROM match_history`).all();
  for (const entry of historyEntries) {
    const mt = entry.match_type || 'singles';
    const team = mt === 'doubles' ? 1 : null;
    insertMP.run(entry.id, entry.player_one, team, mt);
    insertMP.run(entry.id, entry.player_two, mt === 'doubles' ? 2 : null, mt);
  }

  // Migrate round_robin_matches table
  const rrMatches = db.prepare(`SELECT id, player_one_id, player_two_id, match_type FROM round_robin_matches`).all();
  const insertRRMP = db.prepare(`
    INSERT INTO match_players (match_id, player_id, team, match_type, source)
    VALUES (?, ?, ?, ?, 'round_robin')
  `);
  for (const match of rrMatches) {
    const mt = match.match_type || 'singles';
    const team = mt === 'doubles' ? 1 : null;
    insertRRMP.run(match.id, match.player_one_id, team, mt);
    insertRRMP.run(match.id, match.player_two_id, mt === 'doubles' ? 2 : null, mt);
  }

  // Mark migration as complete
  db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('schema_version', '2')`).run();
  console.log("Migration to schema v2 complete (match_players populated)");
});

migration();

// ---- MIGRATION v3: separate permanent player profiles from daily registrations ----

const profileMigration = db.transaction(() => {
  const profileVersion = db.prepare(
    `SELECT value FROM settings WHERE key = 'schema_version'`
  ).get();

  if (profileVersion && profileVersion.value === '3') {
    console.log("Schema already at version: 3");
    return;
  }

  const playersInfo = db.prepare(`PRAGMA table_info(players)`).all();
  const hasDoublesCat = playersInfo.some((col) => col.name === "doubles_category");
  const hasRegDate = playersInfo.some((col) => col.name === "registration_date");
  const hasProfileId = playersInfo.some((col) => col.name === "profile_id");

  if (!hasDoublesCat) {
    db.prepare(`ALTER TABLE players ADD COLUMN doubles_category TEXT DEFAULT 'No Gender Preference'`).run();
  }
if (!hasRegDate) {
    db.prepare(`ALTER TABLE players ADD COLUMN registration_date TEXT DEFAULT CURRENT_DATE`).run();
  }
  if (!hasProfileId) {
    db.prepare(`ALTER TABLE players ADD COLUMN profile_id INTEGER REFERENCES player_profiles(id) ON DELETE SET NULL`).run();
  }

  // Backfill player_profiles from existing players and link them
  const players = db.prepare(`SELECT * FROM players`).all();
  const insertProfile = db.prepare(`
    INSERT INTO player_profiles (name, level, created_at)
    VALUES (?, ?, COALESCE(?, CURRENT_TIMESTAMP))
  `);
  const linkProfile = db.prepare(`
    UPDATE players SET profile_id = ? WHERE id = ?
  `);

  for (const player of players) {
    if (player.profile_id) continue;
    const result = insertProfile.run(player.name, player.level, player.created_at);
    linkProfile.run(result.lastInsertRowid, player.id);
  }

  db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('schema_version', '3')`).run();
  console.log("Migration to schema v3 complete (player profiles separated)");
});

profileMigration();

console.log("Database initialized");
