"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  Clock3,
  FileText,
  Filter,
  Gauge,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  getAnalyticsOverview,
  hasAnalyticsToken,
  type AnalyticsOverview,
} from "@/lib/api";

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const navItems = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Usage", icon: BarChart3 },
  { label: "Sessions", icon: Activity },
  { label: "Conversions", icon: FileText },
];

const adminItems = [
  { label: "Users", icon: Users },
  { label: "Audit log", icon: ShieldCheck },
  { label: "System health", icon: Gauge },
];

const stats = [
  {
    label: "Active time",
    value: "18h 42m",
    change: "+12.8%",
    icon: Clock3,
    tone: "teal",
  },
  {
    label: "Signs displayed",
    value: "24,860",
    change: "+8.4%",
    icon: Activity,
    tone: "blue",
  },
  {
    label: "Sessions",
    value: "186",
    change: "+16.2%",
    icon: Sparkles,
    tone: "green",
  },
  {
    label: "Caption coverage",
    value: "92.4%",
    change: "+4.1%",
    icon: BarChart3,
    tone: "amber",
  },
];

const chartBars = [42, 55, 48, 68, 62, 82, 74, 91, 78, 96, 86, 100, 88, 94];
const sessions = [
  {
    platform: "Google Meet",
    detail: "ASL · 38 min",
    time: "Today, 10:24 AM",
    signs: "1,842",
    status: "Complete",
  },
  {
    platform: "YouTube",
    detail: "ASL · 21 min",
    time: "Yesterday, 4:18 PM",
    signs: "936",
    status: "Complete",
  },
  {
    platform: "Microsoft Teams",
    detail: "ASL · 56 min",
    time: "Yesterday, 11:02 AM",
    signs: "2,914",
    status: "Needs review",
  },
];

export default function Home() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [analyticsState, setAnalyticsState] = useState<
    "demo" | "loading" | "live" | "error"
  >("demo");
  const [popover, setPopover] = useState<"notifications" | "profile" | null>(
    null,
  );

  useEffect(() => {
    if (!hasAnalyticsToken()) return;
    setAnalyticsState("loading");
    getAnalyticsOverview()
      .then((response) => {
        const hasRecordedActivity =
          response.metrics.sessions > 0 || response.metrics.signs_displayed > 0;
        setOverview(hasRecordedActivity ? response : null);
        setAnalyticsState(hasRecordedActivity ? "live" : "demo");
      })
      .catch(() => setAnalyticsState("error"));
  }, []);

  const displayedStats = overview
    ? [
        { ...stats[0], value: formatDuration(overview.metrics.active_seconds) },
        {
          ...stats[1],
          value: overview.metrics.signs_displayed.toLocaleString(),
        },
        { ...stats[2], value: overview.metrics.sessions.toLocaleString() },
        {
          ...stats[3],
          value: overview.metrics.captions_seen
            ? `${Math.round((overview.metrics.signs_displayed / overview.metrics.captions_seen) * 100)}%`
            : "0%",
        },
      ]
    : stats;
  const displayedSessions = overview?.recent_sessions ?? sessions;

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand-lockup">
            <span className="brand-dot" />
            <span>Glossia</span>
            <span className="brand-label">ANALYTICS</span>
          </div>
          <button
            className="icon-button sidebar-close"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <p className="nav-kicker">Workspace</p>
          {navItems.map(({ label, icon: Icon, active }) => (
            <Link
              className={`nav-item ${active ? "nav-item-active" : ""}`}
              href={label === "Overview" ? "/" : `/${label.toLowerCase()}`}
              key={label}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
              {label === "Sessions" && <span className="nav-count">12</span>}
            </Link>
          ))}
          <p className="nav-kicker nav-kicker-admin">Admin</p>
          {adminItems.map(({ label, icon: Icon }) => (
            <Link
              className="nav-item"
              href={`/${label.toLowerCase().replace(" ", "-")}`}
              key={label}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          ))}
          <p className="nav-kicker nav-kicker-admin">Resources</p>
          <Link className="nav-item" href="/docs">
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
          <Link className="nav-item" href="/settings">
            <Settings size={17} strokeWidth={1.8} />
            <span>Settings</span>
          </Link>
          <Link className="profile-row profile-link" href="/settings">
            <div className="avatar">RP</div>
            <div className="profile-copy">
              <strong>Raam Prathap</strong>
              <span>Administrator</span>
            </div>
            <ChevronDown size={15} className="profile-chevron" />
          </Link>
        </div>
      </aside>

      {mobileNavOpen && (
        <button
          className="mobile-backdrop"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <section className="main-content">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={19} />
          </button>
          <div className="breadcrumb">
            <span>Analytics</span>
            <span className="breadcrumb-separator">/</span>
            <strong>Overview</strong>
          </div>
          <div className="topbar-actions">
            <span className="live-status">
              <span
                className={`live-dot ${analyticsState === "error" ? "live-dot-error" : ""}`}
              />
              {analyticsState === "live"
                ? "Live data"
                : analyticsState === "loading"
                  ? "Loading analytics"
                  : analyticsState === "error"
                    ? "API unavailable"
                    : "Demo data"}
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

        <div className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">Thursday, October 16, 2026</p>
              <h1>
                Good morning, Raam<span className="heading-period">.</span>
              </h1>
              <p className="page-subtitle">
                A quiet look at how Glossia is helping conversations move.
              </p>
            </div>
            <div className="heading-controls">
              <button className="date-control">
                <span className="date-dot" />
                Last 30 days
                <ChevronDown size={15} />
              </button>
              <button className="filter-button">
                <Filter size={15} />
                Filters
              </button>
            </div>
          </div>

          <section className="stats-grid" aria-label="Key metrics">
            {displayedStats.map(
              ({ label, value, change, icon: Icon, tone }) => (
                <article className="stat-card" key={label}>
                  <div className={`stat-icon stat-icon-${tone}`}>
                    <Icon size={17} strokeWidth={1.8} />
                  </div>
                  <div className="stat-card-heading">
                    <span>{label}</span>
                    <span className="stat-change">{change}</span>
                  </div>
                  <strong className="stat-value">{value}</strong>
                  <span className="stat-footnote">vs. previous 30 days</span>
                </article>
              ),
            )}
          </section>

          <section className="dashboard-grid">
            <article className="panel activity-panel">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">Activity</p>
                  <h2>Usage over time</h2>
                </div>
                <button className="panel-menu" aria-label="Activity options">
                  •••
                </button>
              </div>
              <div className="chart-summary">
                <strong>8,420</strong>
                <span className="summary-positive">+14.6%</span>
                <span>signs this period</span>
              </div>
              <div className="chart" aria-label="Usage trend chart">
                <div className="chart-y-labels">
                  <span>1k</span>
                  <span>750</span>
                  <span>500</span>
                  <span>250</span>
                  <span>0</span>
                </div>
                <div className="chart-area">
                  <div className="chart-grid-lines">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="bars">
                    {chartBars.map((height, index) => (
                      <span
                        className={index === 11 ? "bar bar-highlight" : "bar"}
                        style={{ height: `${height}%` }}
                        key={index}
                      />
                    ))}
                  </div>
                  <div className="chart-x-labels">
                    <span>Sep 18</span>
                    <span>Sep 25</span>
                    <span>Oct 02</span>
                    <span>Oct 09</span>
                    <span>Oct 16</span>
                  </div>
                </div>
              </div>
            </article>

            <article className="panel breakdown-panel">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">Distribution</p>
                  <h2>Platforms</h2>
                </div>
                <button className="panel-menu" aria-label="Platform options">
                  •••
                </button>
              </div>
              <div className="donut-wrap">
                <div className="donut">
                  <div className="donut-center">
                    <strong>{overview?.metrics.sessions ?? 186}</strong>
                    <span>sessions</span>
                  </div>
                </div>
                <div className="legend">
                  <div>
                    <i className="legend-swatch meet" />
                    <span>Google Meet</span>
                    <strong>48%</strong>
                  </div>
                  <div>
                    <i className="legend-swatch youtube" />
                    <span>YouTube</span>
                    <strong>31%</strong>
                  </div>
                  <div>
                    <i className="legend-swatch teams" />
                    <span>Teams</span>
                    <strong>14%</strong>
                  </div>
                  <div>
                    <i className="legend-swatch other" />
                    <span>Other</span>
                    <strong>7%</strong>
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section className="panel sessions-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Recent activity</p>
                <h2>Latest sessions</h2>
              </div>
              <button className="text-button">
                View all <span>→</span>
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Started</th>
                    <th>Signs displayed</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedSessions.map((session) => (
                    <tr
                      key={
                        ("id" in session ? session.id : undefined) ??
                        `${session.platform}-${"time" in session ? session.time : session.started_at}`
                      }
                    >
                      <td>
                        <div className="platform-cell">
                          <span
                            className={`platform-mark ${session.platform === "YouTube" ? "youtube-mark" : session.platform === "Google Meet" ? "meet-mark" : "teams-mark"}`}
                          />{" "}
                          <div>
                            <strong>{session.platform}</strong>
                            <span>
                              {"detail" in session
                                ? session.detail
                                : `${session.sign_language} · ${formatDuration(session.duration_seconds)}`}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        {"time" in session
                          ? session.time
                          : formatDate(session.started_at)}
                      </td>
                      <td>
                        {"signs" in session
                          ? session.signs
                          : session.signs_displayed.toLocaleString()}
                      </td>
                      <td>
                        <span
                          className={`status-pill ${session.status === "Complete" || session.status === "COMPLETE" ? "status-complete" : "status-review"}`}
                        >
                          <span />
                          {session.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="page-footer">
            <span>
              <span className="footer-dot" />
              Your data is synced and protected
            </span>
            <span>Glossia Analytics · v0.1</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
