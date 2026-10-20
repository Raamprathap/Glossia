"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  FileText,
  Gauge,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

const workspace = [
  ["Overview", "/", LayoutDashboard],
  ["Usage", "/usage", BarChart3],
  ["Sessions", "/sessions", Activity],
  ["Conversions", "/conversions", FileText],
] as const;
const admin = [
  ["Users", "/users", Users],
  ["Audit log", "/audit-log", ShieldCheck],
  ["System health", "/system-health", Gauge],
] as const;

export function DashboardShell({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [popover, setPopover] = useState<"notifications" | "profile" | null>(
    null,
  );
  return (
    <main className="app-shell">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <Link className="brand-lockup" href="/">
            <span className="brand-dot" />
            <span>Glossia</span>
            <span className="brand-label">ANALYTICS</span>
          </Link>
          <button
            className="icon-button sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <p className="nav-kicker">Workspace</p>
          {workspace.map(([label, href, Icon]) => (
            <Link
              className={`nav-item ${active === label ? "nav-item-active" : ""}`}
              href={href}
              key={label}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
              {label === "Sessions" && <span className="nav-count">12</span>}
            </Link>
          ))}
          <p className="nav-kicker nav-kicker-admin">Admin</p>
          {admin.map(([label, href, Icon]) => (
            <Link
              className={`nav-item ${active === label ? "nav-item-active" : ""}`}
              href={href}
              key={label}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          ))}
          <p className="nav-kicker nav-kicker-admin">Resources</p>
          <Link
            className={`nav-item ${active === "Documentation" ? "nav-item-active" : ""}`}
            href="/docs"
          >
            <BookOpen size={17} strokeWidth={1.8} />
            <span>Documentation</span>
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="quota-panel">
            <div className="quota-heading">
              <span>Monthly quota</span>
              <span>14 / 20</span>
            </div>
            <div className="quota-track">
              <span />
            </div>
            <p>6 conversions remaining</p>
          </div>
          <Link
            className={`nav-item ${active === "Settings" ? "nav-item-active" : ""}`}
            href="/settings"
          >
            <Settings size={17} strokeWidth={1.8} />
            <span>Settings</span>
          </Link>
          <div className="profile-row">
            <div className="avatar">RP</div>
            <div className="profile-copy">
              <strong>Raam Prathap</strong>
              <span>Administrator</span>
            </div>
            <ChevronDown size={15} className="profile-chevron" />
          </div>
        </div>
      </aside>
      {open && (
        <button
          className="mobile-backdrop"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <section className="main-content">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={19} />
          </button>
          <div className="breadcrumb">
            <span>Analytics</span>
            <span className="breadcrumb-separator">/</span>
            <strong>{active}</strong>
          </div>
          <div className="topbar-actions">
            <span className="live-status">
              <span className="live-dot" /> Tracking active
            </span>
            <div className="topbar-menu">
              <button
                className="icon-button"
                onClick={() =>
                  setPopover(
                    popover === "notifications" ? null : "notifications",
                  )
                }
                aria-label="Notifications"
              >
                <Bell size={17} />
              </button>
              {popover === "notifications" && (
                <div className="topbar-popover">
                  <strong>Notifications</strong>
                  <p>All systems are operating normally.</p>
                  <Link href="/system-health">View system health</Link>
                </div>
              )}
            </div>
            <div className="topbar-menu">
              <button
                className="profile-mini"
                onClick={() =>
                  setPopover(popover === "profile" ? null : "profile")
                }
                aria-label="Open account menu"
              >
                <span className="avatar avatar-small">RP</span>
                <ChevronDown size={14} />
              </button>
              {popover === "profile" && (
                <div className="topbar-popover profile-popover">
                  <strong>Raam Prathap</strong>
                  <p>Administrator</p>
                  <Link href="/settings">Account settings</Link>
                  <Link href="/login">Sign out</Link>
                </div>
              )}
            </div>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
