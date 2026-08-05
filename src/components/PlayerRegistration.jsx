import { useEffect, useRef, useState } from "react";

const DOUBLES_CATEGORIES = [
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
  "No Gender Preference",
];

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

export default function PlayerRegistration({ onRegistered }) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState("Beginner");
const [doublesCategory, setDoublesCategory] = useState("No Gender Preference");
  const [nameFocused, setNameFocused] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [allPlayers, setAllPlayers] = useState([]);
  const inputRef = useRef(null);

  // Load all permanent players once so they can be shown as dropdown selections
  // while the user types (same database as the All Players page).
  useEffect(() => {
    window.api.getPermanentPlayers()
      .then((data) => setAllPlayers(data || []))
      .catch((err) => console.error("Failed to load all players:", err));
  }, []);

  // Filter permanent players client-side based on the current typed name.
  const searchResults = name.trim()
    ? allPlayers.filter((p) =>
        (p.name || "").toLowerCase().includes(name.trim().toLowerCase())
      )
    : [];

// When a profile is selected from the dropdown, load its data into the form.
  const handleSelectProfile = (profile) => {
    setSelectedProfileId(profile.id);
    setName(profile.name);
    setLevel(profile.level || "Beginner");
setDoublesCategory(profile.doubles_category || "No Gender Preference");
    setNameFocused(false);
    setMessage("Saved profile loaded. You can edit the values before registering.");
  };

  const resetForm = () => {
    setName("");
    setLevel("Beginner");
    setDoublesCategory("No Gender Preference");
setSelectedProfileId(null);
    setNameFocused(false);
    setMessage("");
    setError("");
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      setError("Please enter a player name.");
      return;
    }

    const data = {
      name: name.trim(),
      level,
      doubles_category: doublesCategory,
    };

    // If the handler did not select from the dropdown, check for an exact match.
    if (!selectedProfileId) {
      try {
        const exact = await window.api.findPlayerProfileByName(name.trim());
        if (exact) {
          data.profile_id = exact.id;
          setMessage("Existing player found. Updated their profile and registered for today.");
        }
      } catch (err) {
        console.error("Exact match lookup failed:", err);
      }
    } else {
      data.profile_id = selectedProfileId;
    }

    try {
      const result = await window.api.registerDailyPlayer(data);
      if (result && result.success) {
        setMessage("Player registered for today.");
        setError("");
        resetForm();
        onRegistered?.(result);
      } else {
        setError(result?.error || "Failed to register player.");
      }
    } catch (err) {
      console.error("Registration failed:", err);
      setError("Failed to register player.");
    }
  };

const handleFocus = () => setNameFocused(true);
  const handleBlur = () => {
    // Allow time for click on dropdown items to register.
    setTimeout(() => setNameFocused(false), 150);
  };

  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4">
      <h3 className="font-semibold text-[var(--text-h)] mb-3">Register Player for Today</h3>

      {message && (
        <div className="mb-3 flex items-center justify-between gap-3 bg-[var(--success-light)] text-[var(--success)] px-4 py-3 rounded-xl">
          <p className="text-sm font-medium">{message}</p>
          <button onClick={() => setMessage("")} className="text-sm font-semibold shrink-0">✕</button>
        </div>
      )}

      {error && (
        <div className="mb-3 flex items-center justify-between gap-3 bg-[var(--danger)] text-white px-4 py-3 rounded-xl">
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => setError("")} className="text-white/80 hover:text-white text-sm font-semibold shrink-0">✕</button>
        </div>
      )}

      <div className="space-y-3">
        {/* Name with autocomplete */}
        <div className="relative">
          <label className="block text-xs font-semibold text-[var(--text)] uppercase tracking-wider mb-1">
            Player Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSelectedProfileId(null);
            }}
onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={(e) => { if (e.key === "Enter") handleRegister(); }}
            placeholder="Type to search permanent players..."
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-h)] text-sm placeholder:text-[var(--text)]/50 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
          />
          {nameFocused && searchResults.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectProfile(p)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <span className="w-7 h-7 rounded-full bg-[var(--primary)] text-white text-xs flex items-center justify-center font-medium shrink-0">
                    {p.name.charAt(0)}
                  </span>
                  <span className="text-[var(--text-h)] truncate">{p.name}</span>
                  <span className="text-xs text-[var(--text)] ml-auto shrink-0">{p.level}</span>
                  <span className="text-[10px] text-[var(--primary)] shrink-0">{p.doubles_category}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Level */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text)] uppercase tracking-wider mb-1">
            Level
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-h)]"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Doubles Category */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text)] uppercase tracking-wider mb-1">
            Doubles / Gender Category
          </label>
          <select
            value={doublesCategory}
            onChange={(e) => setDoublesCategory(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-h)]"
          >
            {DOUBLES_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

<button
          onClick={handleRegister}
          disabled={!name.trim()}
          className="w-full px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Register
        </button>
      </div>
    </div>
  );
}
