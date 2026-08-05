# Player Profile & Daily Registration Refactor — Task Tracking

## Steps
- [x] 1. Update `database/init.js` — create `player_profiles` table, add `profile_id`, `doubles_category`, `registration_date` columns to `players`, migration to link existing players
- [x] 2. Update `database/playerQueries.js` — add profile CRUD, search, daily registration, getDailyPlayers, getPermanentPlayers (removed contact/preferred level/preferred mode from registration)
- [x] 3. Update `electron/main.js` + `electron/preload.cjs` — expose new IPC handlers
- [x] 4. Update `database/roundRobinQueries.js` — use today's players only
- [x] 5. Create `src/components/PlayerRegistration.jsx` — autocomplete registration form (removed contact/preferred level/preferred mode fields)
- [x] 6. Create `src/pages/TodayPlayers.jsx` — today's registered players page
- [x] 7. Create `src/pages/AllPlayers.jsx` + `src/components/players/AllPlayersTable.jsx` — permanent player db page (removed Contact column)
- [x] 8. Update `src/components/Sidebar.jsx` — collapsible groups (Queue, Players)
- [x] 9. Update `src/App.jsx` — wire new pages & routing
- [x] 10. Verify build with `npm run build` — ✅ Build succeeded
- [x] 11. Verify lint with `npm run lint` — ✅ Passed cleanly
