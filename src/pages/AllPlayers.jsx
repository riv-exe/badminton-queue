import { useEffect, useState } from "react";
import AllPlayersTable from "../components/players/AllPlayersTable";
import ConfirmDialog from "../components/ConfirmDialog";

export default function AllPlayers() {
  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");

  const loadPlayers = async () => {
    const data = await window.api.getPermanentPlayers();
    setPlayers(data);
  };

useEffect(() => {
    window.api.getPermanentPlayers().then((data) => setPlayers(data));
  }, []);

  const handleDeleteProfile = async (id) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (deleteTarget === null) return;
    await window.api.deletePlayerProfile(deleteTarget);
    setDeleteTarget(null);
    await loadPlayers();
  };

  const filtered = searchTerm.trim()
    ? players.filter((p) =>
        (p.name || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    : players;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center justify-between gap-3 bg-[var(--danger)] text-white px-4 py-3 rounded-xl">
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => setError("")} className="text-white/80 hover:text-white text-sm font-semibold shrink-0">✕</button>
        </div>
      )}

      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4">
        <h3 className="font-semibold text-[var(--text-h)] mb-3">All Registered Players</h3>
        <p className="text-xs text-[var(--text)] mb-3">
          Permanent player database. Profiles are created/updated automatically when players register for a day.
        </p>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search permanent players..."
          className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-h)] text-sm placeholder:text-[var(--text)]/50 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
        />
      </div>

<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[var(--surface)] rounded-2xl border p-4 text-center">
          <p className="text-2xl font-bold">{players.length}</p>
          <p className="text-sm text-[var(--text)]">Total Profiles</p>
        </div>
        <div className="bg-[var(--surface)] rounded-2xl border p-4 text-center">
          <p className="text-2xl font-bold">{players.filter((p) => p.doubles_category !== "No Gender Preference").length}</p>
          <p className="text-sm text-[var(--text)]">With Doubles Category</p>
        </div>
      </div>

      <AllPlayersTable
        players={filtered}
        onDeleteProfile={handleDeleteProfile}
        onRefresh={loadPlayers}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Permanent Player"
        message="Are you sure you want to delete this permanent player profile?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
