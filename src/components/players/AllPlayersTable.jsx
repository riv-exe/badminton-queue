import { useState } from "react";

const DOUBLES_CATEGORIES = [
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
  "No Gender Preference",
];

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

export default function AllPlayersTable({ players, onDeleteProfile, onRefresh }) {
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(null);

const startEdit = (player) => {
    setEditId(player.id);
    setEditForm({
      name: player.name,
      level: player.level,
      doubles_category: player.doubles_category || "No Gender Preference",
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditForm(null);
  };

const saveEdit = async () => {
    if (!editForm || !editForm.name.trim()) return;
    await window.api.updatePlayerProfile(editId, editForm);
    cancelEdit();
    onRefresh?.();
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString();
  };

  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-hover)]/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text)] uppercase tracking-wider">Player</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text)] uppercase tracking-wider">Level</th>
<th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text)] uppercase tracking-wider">Doubles Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text)] uppercase tracking-wider">Created</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--text)] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-[var(--text)]">
                  <p className="text-sm font-medium">No permanent players yet</p>
                  <p className="text-xs mt-1">Players are saved here when they register for a day</p>
                </td>
              </tr>
            ) : (
              players.map((player) => (
                <tr key={player.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-hover)]/50 transition-colors">
                  <td className="px-4 py-4">
                    {editId === player.id && editForm ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="px-2 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-h)] w-40 focus:outline-none focus:border-[var(--primary)]"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-[var(--primary)] text-white text-sm flex items-center justify-center font-medium shrink-0">
                          {player.name.charAt(0)}
                        </span>
                        <span className="text-sm font-medium text-[var(--text-h)]">{player.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {editId === player.id && editForm ? (
                      <select
                        value={editForm.level}
                        onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                        className="px-2 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm"
                      >
                        {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    ) : (
                      <span className="text-sm text-[var(--text)]">{player.level}</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {editId === player.id && editForm ? (
                      <select
                        value={editForm.doubles_category}
                        onChange={(e) => setEditForm({ ...editForm, doubles_category: e.target.value })}
                        className="px-2 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm"
                      >
                        {DOUBLES_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--surface-hover)] text-[var(--text)]">
                        {player.doubles_category}
                      </span>
                    )}
                  </td>
<td className="px-4 py-4 text-sm text-[var(--text)]">{formatDate(player.created_at)}</td>
                  <td className="px-4 py-4 text-right">
                    {editId === player.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={saveEdit}
                          disabled={!editForm?.name.trim()}
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
                          onClick={() => onDeleteProfile?.(player.id)}
                          className="px-3 py-1.5 rounded-lg bg-[var(--danger-light)] text-[var(--danger)] text-xs font-semibold hover:opacity-80 transition-opacity"
                        >
                          Delete
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
  );
}
