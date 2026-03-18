"use client";

import { useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import BrandLogo from "@/components/BrandLogo";

type TopbarProps = {
  onMenuToggle: () => void;
  onSidebarToggle: () => void;
  sidebarMinimized: boolean;
  mode: "admin" | "teacher";
  homeHref: string;
  settingsHref?: string;
  profileName?: string;
  profileEmail?: string;
};

const notifications = [
  "New invoice payment received",
  "3 teachers updated grade sheets",
  "Weekly analytics report generated",
];

export default function Topbar({
  onMenuToggle,
  onSidebarToggle,
  sidebarMinimized,
  mode,
  homeHref,
  settingsHref,
  profileName,
  profileEmail,
}: TopbarProps) {
  const { signOut } = useClerk();
  const { sessionId } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const roleLabel = mode === "teacher" ? "Teacher" : "Admin";

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
    const signOutPromise = sessionId
      ? signOut({ sessionId, redirectUrl: "/sign-in" })
      : signOut({ redirectUrl: "/sign-in" });
    void signOutPromise.catch(() => {
      setIsSigningOut(false);
    });
  }

  return (
    <div className="main-header">
      <div className="main-header-logo">
        <div className="logo-header" data-background-color="dark">
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
            <button
              type="button"
              className="topbar-toggler mobile-signout"
              onClick={handleSignOut}
              aria-label="Sign out"
              disabled={isSigningOut}
            >
              <i className="fas fa-sign-out-alt" />
            </button>
            <button type="button" className="topbar-toggler more" onClick={onMenuToggle} aria-label="Open menu">
              <i className="gg-more-vertical-alt" />
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
            <li className="nav-item topbar-icon dropdown hidden-caret">
              <button
                type="button"
                className="nav-link dropdown-toggle border-0 bg-transparent"
                onClick={() => {
                  setNotificationsOpen((current) => !current);
                  setProfileOpen(false);
                }}
                aria-label="Notifications"
              >
                <i className="fa fa-bell" />
                <span className="notification">{notifications.length}</span>
              </button>

              {notificationsOpen ? (
                <ul className="dropdown-menu notif-box animated fadeIn show">
                  <li>
                    <div className="dropdown-title">Notifications</div>
                  </li>
                  <li>
                    <div className="notif-center">
                      {notifications.map((item) => (
                        <a href="#notifications" key={item}>
                          <div className="notif-icon notif-success">
                            <i className="fa fa-info" />
                          </div>
                          <div className="notif-content">
                            <span className="block">{item}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </li>
                </ul>
              ) : null}
            </li>

            <li className="nav-item topbar-user dropdown hidden-caret">
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

              {profileOpen ? (
                <ul className="dropdown-menu dropdown-user animated fadeIn show">
                  <div className="dropdown-user-scroll scrollbar-outer">
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
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="dropdown-divider" />
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
              ) : null}
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
}
