import { useEffect, useState } from "react";
import PlayerRegistration from "../components/PlayerRegistration";
import ConfirmDialog from "../components/ConfirmDialog";

const statusColors = {
  waiting: "bg-[var(--success-light)] text-[var(--success)]",
  playing: "bg-[var(--primary-light)] text-[var(--primary)]",
  finished: "bg-[var(--surface-hover)] text-[var(--text)]",
};

export default function TodayPlayers() {
  const [players, setPlayers] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editLevel, setEditLevel] = useState("");

  const startEdit = (player) => {
    setEditId(player.id);
    setEditName(player.name);
    setEditLevel(player.level);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
    setEditLevel("");
  };

  const saveEdit = async () => {
    if (editId === null || !editName.trim()) return;
    const result = await window.api.updatePlayer(editId, editName.trim(), editLevel);
    if (result && result.success === false) {
      setError(result.error || "Failed to update player.");
      return;
    }
    cancelEdit();
    await loadPlayers();
  };

  const loadPlayers = async () => {
    const data = await window.api.getDailyPlayers();
    setPlayers(data);
  };

  useEffect(() => {
    window.api.getDailyPlayers().then((data) => setPlayers(data));
  }, []);

  const handleDeletePlayer = async (id) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (deleteTarget === null) return;
    const result = await window.api.deletePlayer(deleteTarget);
    setDeleteTarget(null);
    if (result && result.success === false) {
      setError(result.error || "Cannot delete this player right now.");
      return;
    }
    await loadPlayers();
  };

  const waitingCount = players.filter((p) => p.status === "waiting").length;
  const playingCount = players.filter((p) => p.status === "playing").length;
  const totalMatches = players.reduce((sum, p) => sum + (p.matches_played || 0), 0);

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center justify-between gap-3 bg-[var(--danger)] text-white px-4 py-3 rounded-xl">
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => setError("")} className="text-white/80 hover:text-white text-sm font-semibold shrink-0">
            ✕
          </button>
        </div>
      )}

      <PlayerRegistration onRegistered={loadPlayers} />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--text-h)]">{players.length}</p>
          <p className="text-xs text-[var(--text)]/70 mt-0.5">Registered Today</p>
        </div>
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--primary)]">{playingCount}</p>
          <p className="text-xs text-[var(--text)]/70 mt-0.5">Playing</p>
        </div>
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--text-h)]">{totalMatches}</p>
          <p className="text-xs text-[var(--text)]/70 mt-0.5">Total Matches</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--text-h)]">Today's Registered Players</h3>
          <p className="text-xs text-[var(--text)]/70 mt-0.5">
            {waitingCount} waiting — used in the rotation queue, round robin, matches, and courts.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-[var(--text)]/60">Player</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-[var(--text)]/60">Level</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-[var(--text)]/60">Doubles Category</th>
                <th className="text-center px-5 py-2.5 text-xs font-medium text-[var(--text)]/60">Matches</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-[var(--text)]/60">Status</th>
                <th className="text-right px-5 py-2.5 text-xs font-medium text-[var(--text)]/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--text)]">
                    <p className="text-sm font-medium">No players registered today</p>
                    <p className="text-xs mt-1 text-[var(--text)]/60">Register players using the form above</p>
                  </td>
                </tr>
              ) : (
                players.map((player) => (
                  <tr
                    key={player.id}
                    className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-hover)]/50 transition-colors"
                  >
<td className="px-5 py-3">
                      {editId === player.id ? (
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-[var(--primary)] text-white text-xs flex items-center justify-center font-medium shrink-0">
                            {editName.charAt(0)}
                          </span>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-2 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-h)] w-32 focus:outline-none focus:border-[var(--primary)]"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-[var(--primary)] text-white text-xs flex items-center justify-center font-medium shrink-0">
                            {player.name.charAt(0)}
                          </span>
                          <span className="text-sm font-medium text-[var(--text-h)]">{player.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {editId === player.id ? (
                        <select
                          value={editLevel}
                          onChange={(e) => setEditLevel(e.target.value)}
                          className="px-2 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-h)]"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      ) : (
                        <span className="text-sm text-[var(--text)]">{player.level}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--surface-hover)] text-[var(--text)]">
                        {player.doubles_category}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-sm font-semibold text-[var(--text-h)]">
                        {player.matches_played || 0}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[player.status] || "bg-[var(--surface-hover)] text-[var(--text)]"}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {player.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {editId === player.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={saveEdit}
                            disabled={!editName.trim()}
                            className="px-3 py-1.5 rounded-lg bg-[var(--success)] text-white text-xs font-semibold hover:opacity-80 transition-opacity disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1.5 rounded-lg bg-[var(--surface-hover)] text-[var(--text)] text-xs font-semibold hover:opacity-80 transition-opacity"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(player)}
                            className="px-3 py-1.5 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] text-xs font-semibold hover:opacity-80 transition-opacity"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePlayer(player.id)}
                            disabled={player.status === "playing"}
                            title={player.status === "playing" ? "Cannot delete a player who is currently playing" : "Delete registration"}
className="px-3 py-1.5 rounded-lg bg-[var(--danger-light)] text-[var(--danger)] text-xs font-semibold hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {player.status === "playing" ? "In Match" : "Remove"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Remove Player"
        message="Remove today's registration for this player?"
        confirmLabel="Remove"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}