"use client";

import { useState } from "react";

type TopbarProps = {
  onMenuToggle: () => void;
  profileName?: string;
  profileEmail?: string;
};

const notifications = [
  "New invoice payment received",
  "3 teachers updated grade sheets",
  "Weekly analytics report generated",
];

export default function Topbar({ onMenuToggle, profileName, profileEmail }: TopbarProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--admin-border)] bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuToggle}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--admin-border)] text-[var(--admin-muted)] hover:bg-neutral-100 lg:hidden"
          aria-label="Open navigation"
        >
          <span className="text-lg">≡</span>
        </button>

        <div className="hidden max-w-md flex-1 lg:block">
          <div className="flex h-10 items-center rounded-lg border border-[var(--admin-border)] bg-neutral-50 px-3 text-sm text-[var(--admin-muted)]">
            Search analytics...
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((current) => !current);
                setProfileOpen(false);
              }}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--admin-border)] text-[var(--admin-muted)] hover:bg-neutral-100"
              aria-label="Notifications"
            >
              <span>🔔</span>
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-secondary)] px-1 text-[10px] font-semibold text-white">
                {notifications.length}
              </span>
            </button>

            {notificationsOpen ? (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-[var(--admin-border)] bg-white p-2 shadow-lg">
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">Notifications</p>
                <ul className="mt-1 space-y-1">
                  {notifications.map((item) => (
                    <li key={item} className="rounded-lg px-2 py-2 text-sm text-[var(--admin-text)] hover:bg-neutral-50">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((current) => !current);
                setNotificationsOpen(false);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--admin-border)] px-2 py-1.5 hover:bg-neutral-100"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--brand-primary-soft)] text-xs font-semibold text-[var(--brand-primary)]">
                AD
              </span>
              <span className="hidden text-sm font-medium text-[var(--admin-text)] sm:inline">
                {profileName ?? "Admin User"}
              </span>
            </button>

            {profileOpen ? (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--admin-border)] bg-white p-1.5 shadow-lg">
                <p className="px-3 pb-1 pt-1 text-[11px] uppercase tracking-wide text-[var(--admin-muted)]">{profileEmail ?? "admin@iweos.app"}</p>
                <button type="button" className="block w-full rounded-md px-3 py-2 text-left text-sm text-[var(--admin-text)] hover:bg-neutral-100">
                  Profile
                </button>
                <button type="button" className="block w-full rounded-md px-3 py-2 text-left text-sm text-[var(--admin-text)] hover:bg-neutral-100">
                  Account Settings
                </button>
                <button type="button" className="block w-full rounded-md px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
