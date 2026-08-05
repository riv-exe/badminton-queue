import db from "./database.js";

// Ensure the new columns exist (defensive for edge cases)
function ensurePlayerColumns() {
  const playersInfo = db.prepare(`PRAGMA table_info(players)`).all();
  const hasDoublesCat = playersInfo.some((col) => col.name === "doubles_category");
  const hasRegDate = playersInfo.some((col) => col.name === "registration_date");
  const hasProfileId = playersInfo.some((col) => col.name === "profile_id");

  if (!hasDoublesCat) {
    db.prepare(`ALTER TABLE players ADD COLUMN doubles_category TEXT DEFAULT 'No Gender Preference'`).run();
  }
  if (!hasRegDate) {
    db.prepare(`ALTER TABLE players ADD COLUMN registration_date TEXT DEFAULT (date('now'))`).run();
  }
  if (!hasProfileId) {
    db.prepare(`ALTER TABLE players ADD COLUMN profile_id INTEGER REFERENCES player_profiles(id) ON DELETE SET NULL`).run();
  }
}
ensurePlayerColumns();

// ---------- Permanent Player Profiles ----------

export function getPermanentPlayers() {
  return db.prepare(`
    SELECT id, name, level, contact_info, doubles_category, preferred_level, preferred_mode, created_at
    FROM player_profiles
    ORDER BY name ASC
  `).all();
}

export function getPlayerProfile(id) {
  return db.prepare(`
    SELECT id, name, level, contact_info, doubles_category, preferred_level, preferred_mode, created_at
    FROM player_profiles
    WHERE id = ?
  `).get(id);
}

export function searchPlayerProfiles(searchTerm) {
  const term = `%${searchTerm}%`;
  return db.prepare(`
    SELECT id, name, level, contact_info, doubles_category, preferred_level, preferred_mode, created_at
    FROM player_profiles
    WHERE name LIKE ?
    ORDER BY name ASC
    LIMIT 20
  `).all(term);
}

export function findPlayerProfileByName(name) {
  return db.prepare(`
    SELECT id, name, level, contact_info, doubles_category, preferred_level, preferred_mode, created_at
    FROM player_profiles
    WHERE name = ? COLLATE NOCASE
    LIMIT 1
  `).get(name);
}

export function createPlayerProfile({ name, level, doubles_category }) {
  const result = db.prepare(`
    INSERT INTO player_profiles (name, level, doubles_category)
    VALUES (?, ?, ?)
  `).run(
    name,
    level || 'Beginner',
    doubles_category || 'No Gender Preference'
  );
  return result.lastInsertRowid;
}

export function updatePlayerProfile(id, { name, level, doubles_category }) {
  db.prepare(`
    UPDATE player_profiles
    SET name = ?, level = ?, doubles_category = ?
    WHERE id = ?
  `).run(
    name,
    level || 'Beginner',
    doubles_category || 'No Gender Preference',
    id
  );
  return { success: true };
}

export function deletePlayerProfile(id) {
  db.prepare(`DELETE FROM player_profiles WHERE id = ?`).run(id);
  return { success: true };
}

// ---------- Daily Registration (today's players) ----------

export function getDailyPlayers() {
  return db.prepare(`
    SELECT
      players.*,
      COUNT(DISTINCT match_players.match_id) AS matches_played
    FROM players
    LEFT JOIN match_players ON match_players.player_id = players.id
      AND match_players.source IN ('normal', 'round_robin')
    WHERE players.registration_date = date('now')
    GROUP BY players.id
    ORDER BY players.id DESC
  `).all();
}

// Register a player for today. Returns today's player row id.
export function registerDailyPlayer({ name, level, doubles_category, profile_id }) {
  // If a profile_id isn't provided, see if an exact profile match exists.
  let resolvedProfileId = profile_id || null;
  if (!resolvedProfileId) {
    const existing = findPlayerProfileByName(name);
    if (existing) {
      resolvedProfileId = existing.id;
    }
  }

  // If we have a resolved profile, update it with the edited registration data.
  if (resolvedProfileId) {
    updatePlayerProfile(resolvedProfileId, {
      name,
      level,
      doubles_category,
    });
  } else {
    // No match -> create a new permanent player profile.
    resolvedProfileId = createPlayerProfile({
      name,
      level,
      doubles_category,
    });
  }

  // Create today's registration record referencing the profile.
  const result = db.prepare(`
    INSERT INTO players (name, level, doubles_category, registration_date, profile_id)
    VALUES (?, ?, ?, date('now'), ?)
  `).run(name, level || 'Beginner', doubles_category || 'No Gender Preference', resolvedProfileId);

  return { success: true, id: result.lastInsertRowid, profile_id: resolvedProfileId };
}

// Called at the start of a new day to clear today's active system state.
export function resetDailySystem() {
  // Clear queue
  db.prepare(`DELETE FROM queue`).run();
  // Reset today's players' status
  db.prepare(`UPDATE players SET status = 'waiting' WHERE registration_date = date('now')`).run();
  // Clear pending round robin matches
  db.prepare(`DELETE FROM round_robin_matches WHERE status != 'playing'`).run();
  // Reset courts
  db.prepare(`UPDATE courts SET status = 'available'`).run();
  return { success: true };
}

// ---------- Legacy / Compatibility functions (today's players) ----------

export function addPlayer(name, level) {
  const existingPlayer = db.prepare(`
    SELECT id
    FROM players
    WHERE name = ?
  `).get(name);

  if (existingPlayer) {
    return existingPlayer.id;
  }

  const result = db.prepare(`
    INSERT INTO players(name, level)
    VALUES(?, ?)
  `).run(name, level);

  return result.lastInsertRowid;
}

export function getPlayers() {
  return getDailyPlayers();
}

export function deletePlayer(id) {
  // Prevent deleting a player who is currently playing
  const activeNormalMatch = db.prepare(`
    SELECT id FROM matches
    WHERE (player_one = ? OR player_two = ?) AND status = 'playing'
  `).get(id, id);

  const activeRRMatch = db.prepare(`
    SELECT id FROM round_robin_matches
    WHERE (player_one_id = ? OR player_two_id = ?) AND status = 'playing'
  `).get(id, id);

  if (activeNormalMatch || activeRRMatch) {
    return {
      success: false,
      error: "Cannot delete a player who is currently playing. End their match first."
    };
  }

  const transaction = db.transaction(() => {
    db.prepare(`DELETE FROM match_players WHERE player_id = ?`).run(id);
    db.prepare(`DELETE FROM queue WHERE player_id = ?`).run(id);
    db.prepare(`DELETE FROM round_robin_matches WHERE player_one_id = ? OR player_two_id = ?`).run(id, id);
    db.prepare(`DELETE FROM matches WHERE player_one = ? OR player_two = ?`).run(id, id);
    db.prepare(`DELETE FROM match_history WHERE player_one = ? OR player_two = ?`).run(id, id);
    db.prepare(`DELETE FROM players WHERE id = ?`).run(id);
  });

  transaction();
  return { success: true };
}

export function updatePlayer(id, name, level) {
  db.prepare(`
    UPDATE players
    SET name = ?, level = ?
    WHERE id = ?
  `).run(name, level, id);

  return { success: true };
}
