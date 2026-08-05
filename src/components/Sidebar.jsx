import { useState } from "react";
import {
  ListOrdered,
  Users,
  LayoutGrid,
  Monitor,
  Settings,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const navGroups = [
  {
    id: "queue",
    label: "Queue",
    icon: ListOrdered,
    items: [
      { id: "queue", label: "Rotation Queue" },
      { id: "roundrobin", label: "Round Robin" },
    ],
  },
  {
    id: "players",
    label: "Players",
    icon: Users,
    items: [
      { id: "todayplayers", label: "Today's Players" },
      { id: "allplayers", label: "All Players" },
    ],
  },
];

const standaloneItems = [
  { id: "courts", label: "Courts", icon: LayoutGrid },
  { id: "public", label: "Public Display", icon: Monitor },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ activePage, onNavigate, collapsed, onToggle }) {
  const [openGroups, setOpenGroups] = useState({
    queue: ["queue", "roundrobin"].includes(activePage),
    players: ["todayplayers", "allplayers"].includes(activePage),
  });

  const toggleGroup = (groupId) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const isGroupActive = (groupId) => {
    const group = navGroups.find((g) => g.id === groupId);
    return group.items.some((item) => item.id === activePage);
  };

  const renderNavButton = (item) => {
    const Icon = item.icon;
    const isActive = activePage === item.id;
    return (
      <button
        key={item.id}
        onClick={() => onNavigate(item.id)}
        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? "bg-[var(--primary-light)] text-[var(--primary)] font-medium"
            : "text-[var(--text)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-h)]"
        }`}
        title={collapsed ? item.label : undefined}
      >
        {Icon && <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />}
        {!collapsed && <span className="truncate">{item.label}</span>}
      </button>
    );
  };

  return (
    <aside
      className={`h-screen bg-[var(--surface)] border-r border-[var(--border)] flex flex-col transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      
      <div className="h-14 flex items-center px-3 border-b border-[var(--border)]">
        {!collapsed && (
          <span className="font-semibold text-sm tracking-wide text-[var(--text-h)] truncate">
            Badminton Queue
          </span>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1.5 rounded-md text-[var(--text)]/70 hover:bg-[var(--surface-hover)] hover:text-[var(--text-h)] transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navGroups.map((group) => {
          const Icon = group.icon;
          const isExpanded = openGroups[group.id];
          const groupActive = isGroupActive(group.id);
          return (
            <div key={group.id}>
              <button
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                  groupActive
                    ? "text-[var(--primary)] font-medium"
                    : "text-[var(--text)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-h)]"
                }`}
                title={collapsed ? group.label : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                {!collapsed && (
                  <>
                    <span className="truncate flex-1 text-left">{group.label}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </>
                )}
              </button>

              {!collapsed && (
                <div
                  className={`grid transition-all duration-200 ${
                    isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="pl-6 pt-0.5 pb-0.5 space-y-0.5">
                      {group.items.map((item) => {
                        const itemActive = activePage === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`w-full flex items-center px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                              itemActive
                                ? "bg-[var(--primary-light)] text-[var(--primary)] font-medium"
                                : "text-[var(--text)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-h)]"
                            }`}
                          >
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {standaloneItems.map((item) => renderNavButton(item))}
      </nav>

      
      <div className="border-t border-[var(--border)] px-3 py-3">
        {!collapsed && <p className="text-xs text-[var(--text)]/60">v1.0.0</p>}
      </div>
    </aside>
  );
}