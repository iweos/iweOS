"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import ThemeToggle from "@/components/ThemeToggle";
import type { SchoolAccessOption } from "@/types";

type TopbarProps = {
  onMenuToggle: () => void;
  onSidebarToggle: () => void;
  sidebarMinimized: boolean;
  mode: "admin" | "teacher";
  homeHref: string;
  settingsHref?: string;
  profileName?: string;
  profileEmail?: string;
  currentSchoolName?: string;
  currentProfileId?: string;
  schoolOptions?: SchoolAccessOption[];
  platformAdmin?: boolean;
};

type TopbarNotification = {
  id: string;
  title: string;
  message: string;
  href?: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function Topbar({
  onMenuToggle,
  onSidebarToggle,
  sidebarMinimized,
  mode,
  homeHref,
  settingsHref,
  profileName,
  profileEmail,
  currentSchoolName,
  currentProfileId,
  schoolOptions = [],
  platformAdmin = false,
}: TopbarProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [switchingProfileId, setSwitchingProfileId] = useState<string | null>(null);
  const [addSchoolOpen, setAddSchoolOpen] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [createSchoolError, setCreateSchoolError] = useState("");
  const [creatingSchool, setCreatingSchool] = useState(false);
  const [notifications, setNotifications] = useState<TopbarNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const roleLabel = mode === "teacher" ? "Teacher" : "Admin";
  const hasNotifications = notifications.length > 0;

  const notificationLabel = useMemo(() => {
    if (unreadCount > 0) {
      return unreadCount;
    }
    return notifications.length;
  }, [notifications.length, unreadCount]);

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          items: TopbarNotification[];
          unreadCount: number;
        };

        if (cancelled) {
          return;
        }

        setNotifications(payload.items);
        setUnreadCount(payload.unreadCount);
      } catch {
        // Fail silently in the shell; notifications are additive.
      }
    }

    void loadNotifications();
    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  function formatNotificationTime(value: string) {
    const date = new Date(value);
    const deltaMs = Date.now() - date.getTime();
    const deltaMinutes = Math.max(1, Math.floor(deltaMs / 60000));

    if (deltaMinutes < 60) {
      return `${deltaMinutes}m ago`;
    }

    const deltaHours = Math.floor(deltaMinutes / 60);
    if (deltaHours < 24) {
      return `${deltaHours}h ago`;
    }

    const deltaDays = Math.floor(deltaHours / 24);
    return `${deltaDays}d ago`;
  }

  async function markNotificationsRead() {
    try {
      await fetch("/api/notifications", {
        method: "POST",
      });
      setUnreadCount(0);
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch {
      // Ignore badge sync failure.
    }
  }

  function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("iweos:pending-indicator", {
        detail: { durationMs: 9000 },
      }),
    );
    setIsSigningOut(true);
    setProfileOpen(false);
    setNotificationsOpen(false);
    void fetch("/api/auth/sign-out", { method: "POST" })
      .then(() => window.location.assign("/sign-in"))
      .catch(() => setIsSigningOut(false));
  }

  async function handleSchoolSwitch(profileId: string) {
    if (profileId === currentProfileId || switchingProfileId) return;
    setSwitchingProfileId(profileId);
    window.dispatchEvent(new CustomEvent("iweos:pending-indicator", { detail: { durationMs: 9000 } }));
    try {
      const response = await fetch("/api/auth/switch-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
      const payload = (await response.json()) as { destination?: string; error?: string };
      if (!response.ok || !payload.destination) throw new Error(payload.error || "Unable to switch school.");
      window.location.assign(payload.destination);
    } catch (error) {
      setSwitchingProfileId(null);
      window.alert(error instanceof Error ? error.message : "Unable to switch school.");
    }
  }

  async function handleCreateSchool(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creatingSchool || newSchoolName.trim().length < 2) return;
    setCreatingSchool(true);
    setCreateSchoolError("");
    window.dispatchEvent(new CustomEvent("iweos:pending-indicator", { detail: { durationMs: 12000 } }));
    try {
      const response = await fetch("/api/auth/create-school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolName: newSchoolName }),
      });
      const payload = (await response.json()) as { destination?: string; error?: string };
      if (!response.ok || !payload.destination) throw new Error(payload.error || "Unable to create this school.");
      window.location.assign(payload.destination);
    } catch (error) {
      setCreateSchoolError(error instanceof Error ? error.message : "Unable to create this school.");
      setCreatingSchool(false);
    }
  }

  function openAddSchool() {
    setProfileOpen(false);
    setCreateSchoolError("");
    setNewSchoolName("");
    setAddSchoolOpen(true);
  }

  function renderProfileMenu(layer: "desktop" | "mobile") {
    return (
      <div className={`topbar-profile-layer topbar-profile-layer-${layer}`}>
        <button type="button" className="topbar-profile-scrim" aria-label="Close account menu" onClick={() => setProfileOpen(false)} />
        <ul className="dropdown-menu dropdown-user animated fadeIn show">
          <div className="dropdown-user-scroll scrollbar-outer">
            <li className="topbar-sheet-handle" aria-hidden="true"><span /></li>
            <li>
              <div className="user-box">
                <div className="avatar-lg">
                  <div className="avatar-img rounded d-flex align-items-center justify-content-center admin-profile-avatar admin-profile-avatar-lg">
                    <i className="icon-user-following" aria-hidden="true" />
                  </div>
                </div>
                <div className="u-text">
                  <h4>{profileName ?? `${roleLabel} User`}</h4>
                  <p className="text-muted">{profileEmail ?? "admin@iweos.app"}</p>
                  {currentSchoolName ? <p className="topbar-current-school">{currentSchoolName}</p> : null}
                </div>
              </div>
            </li>
            <li>
              <div className="dropdown-divider" />
              {schoolOptions.length ? (
                <div className="topbar-school-switcher">
                  <p className="topbar-menu-label">School workspace</p>
                  <div className="topbar-school-select-row">
                    <span className="topbar-school-mark">{currentSchoolName?.slice(0, 1).toUpperCase() || "S"}</span>
                    <label className="topbar-school-select">
                      <span className="visually-hidden">Change school</span>
                      <select
                        value={currentProfileId}
                        onChange={(event) => void handleSchoolSwitch(event.target.value)}
                        disabled={switchingProfileId !== null}
                      >
                        {schoolOptions.map((option) => (
                          <option value={option.profileId} key={option.profileId}>
                            {option.schoolName} - {option.role}
                          </option>
                        ))}
                      </select>
                      <small>{switchingProfileId ? "Switching workspace..." : `${schoolOptions.length} ${schoolOptions.length === 1 ? "workspace" : "workspaces"}`}</small>
                    </label>
                    <button type="button" className="topbar-add-school" onClick={openAddSchool} aria-label="Add another school" title="Add another school">
                      <i className="fas fa-plus" />
                    </button>
                  </div>
                  <div className="dropdown-divider" />
                </div>
              ) : null}
              {platformAdmin ? (
                <Link className="dropdown-item" href="/platform">
                  <i className="fas fa-layer-group me-2" /> iweOS Administration
                </Link>
              ) : null}
              {settingsHref ? (
                <a className="dropdown-item" href={settingsHref}>
                  Account Settings
                </a>
              ) : null}
              <button
                type="button"
                className="dropdown-item text-danger border-0 bg-transparent text-start w-100"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? "Signing out..." : "Sign out"}
              </button>
            </li>
          </div>
        </ul>
      </div>
    );
  }

  return (
    <div className="main-header">
      <div className="main-header-logo">
        <div className="logo-header" data-background-color="dark">
          <div className="topbar-mobile-leading">
            <button
              type="button"
              className="btn btn-toggle mobile-header-action mobile-menu-trigger"
              onClick={onMenuToggle}
              aria-label="Open menu"
            >
              <i className="fas fa-bars" />
            </button>
          </div>
          <BrandLogo
            href={homeHref}
            variant="light"
            className="logo"
            iconClassName="navbar-brand logo-icon"
            textClassName="logo-title"
          />
          <div className="nav-toggle">
            <button type="button" className="btn btn-toggle toggle-sidebar" onClick={onSidebarToggle} aria-label="Toggle sidebar">
              <i className={sidebarMinimized ? "gg-more-vertical-alt" : "gg-menu-right"} />
            </button>
            <button type="button" className="btn btn-toggle sidenav-toggler" onClick={onMenuToggle} aria-label="Open menu">
              <i className="gg-menu-left" />
            </button>
          </div>
          <div className="topbar-mobile-actions">
            <ThemeToggle className="btn btn-toggle mobile-header-action mobile-theme-toggle" />
            <button
              type="button"
              className="btn btn-toggle mobile-header-action mobile-profile-trigger"
              onClick={() => {
                setProfileOpen((current) => !current);
                setNotificationsOpen(false);
              }}
              aria-label="Open account and school menu"
              aria-expanded={profileOpen}
            >
              <i className="icon-user-following" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <nav className="navbar navbar-header navbar-header-transparent navbar-expand-lg border-bottom">
        <div className="container-fluid">
          <nav className="navbar navbar-header-left navbar-expand-lg navbar-form nav-search p-0 d-none d-lg-flex">
            <div className="input-group">
            <div className="input-group-prepend">
                <button type="button" className="btn btn-search pe-1">
                  <i className="fa fa-search search-icon" />
                </button>
              </div>
              <input
                type="text"
                placeholder={mode === "teacher" ? "Search students, classes, scores..." : "Search students, teachers, payments..."}
                className="form-control"
              />
            </div>
          </nav>

          <ul className="navbar-nav topbar-nav ms-md-auto align-items-center">
            <li className="nav-item topbar-icon hidden-caret">
              <ThemeToggle className="nav-link border-0 bg-transparent topbar-theme-toggle" />
            </li>
            <li className="nav-item topbar-icon dropdown hidden-caret" data-tour="topbar-notifications">
              <button
                type="button"
                className="nav-link dropdown-toggle border-0 bg-transparent"
                onClick={() => {
                  const nextOpen = !notificationsOpen;
                  setNotificationsOpen(nextOpen);
                  setProfileOpen(false);
                  if (nextOpen) {
                    void markNotificationsRead();
                  }
                }}
                aria-label="Notifications"
              >
                <i className="fa fa-bell" />
                {notificationLabel > 0 ? <span className="notification">{notificationLabel}</span> : null}
              </button>

              {notificationsOpen ? (
                <ul className="dropdown-menu notif-box animated fadeIn show">
                  <li>
                    <div className="dropdown-title">Notifications</div>
                  </li>
                  <li>
                    <div className="notif-center">
                      {hasNotifications ? notifications.map((item) => (
                        <Link href={item.href || "#"} key={item.id} onClick={() => setNotificationsOpen(false)}>
                          <div className={`notif-icon ${item.isRead ? "notif-success" : "notif-primary"}`}>
                            <i className="fa fa-info" />
                          </div>
                          <div className="notif-content">
                            <span className="block fw-semibold">{item.title}</span>
                            <span className="time">{item.message}</span>
                            <span className="time">{formatNotificationTime(item.createdAt)}</span>
                          </div>
                        </Link>
                      )) : (
                        <div className="px-3 py-3 text-sm text-muted">No notifications yet.</div>
                      )}
                    </div>
                  </li>
                </ul>
              ) : null}
            </li>

            <li className="nav-item topbar-user dropdown hidden-caret" data-tour="topbar-profile">
              <button
                type="button"
                className="dropdown-toggle profile-pic border-0 bg-transparent"
                onClick={() => {
                  setProfileOpen((current) => !current);
                  setNotificationsOpen(false);
                }}
              >
                <div className="avatar-sm">
                  <div className="avatar-img rounded-circle d-flex align-items-center justify-content-center admin-profile-avatar">
                    <i className="icon-user-following" aria-hidden="true" />
                  </div>
                </div>
                <span className="profile-username">
                  <span className="op-7">Hi,</span> <span className="fw-bold">{profileName ?? roleLabel}</span>
                </span>
              </button>

              {profileOpen ? renderProfileMenu("desktop") : null}
            </li>
          </ul>
        </div>
      </nav>
      {profileOpen ? renderProfileMenu("mobile") : null}
      {addSchoolOpen ? (
        <div className="topbar-add-school-layer" role="presentation">
          <button type="button" className="topbar-add-school-scrim" aria-label="Close add school" onClick={() => !creatingSchool && setAddSchoolOpen(false)} />
          <section className="topbar-add-school-dialog" role="dialog" aria-modal="true" aria-labelledby="add-school-title">
            <span className="topbar-dialog-handle" aria-hidden="true" />
            <button type="button" className="topbar-dialog-close" onClick={() => setAddSchoolOpen(false)} disabled={creatingSchool} aria-label="Close"><i className="fas fa-times" /></button>
            <span className="topbar-dialog-icon"><i className="fas fa-school" /></span>
            <p className="topbar-menu-label">New workspace</p>
            <h2 id="add-school-title">Add another school</h2>
            <p>You will become the administrator of this school while keeping access to your existing workspaces.</p>
            <form onSubmit={handleCreateSchool}>
              <label htmlFor="new-school-name">School name</label>
              <input id="new-school-name" value={newSchoolName} onChange={(event) => setNewSchoolName(event.target.value)} maxLength={120} autoComplete="organization" placeholder="e.g. Greenwood Academy" autoFocus required />
              {createSchoolError ? <div className="topbar-dialog-error" role="alert">{createSchoolError}</div> : null}
              <div className="topbar-dialog-actions">
                <button type="button" onClick={() => setAddSchoolOpen(false)} disabled={creatingSchool}>Cancel</button>
                <button type="submit" disabled={creatingSchool || newSchoolName.trim().length < 2}>{creatingSchool ? "Creating school..." : "Create school"}</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
