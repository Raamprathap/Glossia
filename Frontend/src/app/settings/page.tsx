"use client";

import { useState } from "react";
import { Bell, LockKeyhole, Save, SlidersHorizontal } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageView } from "@/components/page-view";
export default function SettingsPage() {
  const [telemetry, setTelemetry] = useState(true);
  return (
    <DashboardShell active="Settings">
      <PageView
        eyebrow="Workspace / Settings"
        title="Make Glossia yours"
        description="Control how the extension behaves and how your analytics are collected."
      >
        <div className="settings-grid">
          <section className="panel settings-section">
            <div className="section-icon">
              <SlidersHorizontal size={17} />
            </div>
            <p className="panel-kicker">Extension</p>
            <h2>Display preferences</h2>
            <label className="setting-row">
              <span>
                <strong>Sign language</strong>
                <small>Choose the language used by the avatar.</small>
              </span>
              <select defaultValue="ASL">
                <option>ASL</option>
                <option>BSL</option>
                <option>ISL</option>
                <option>Auslan</option>
              </select>
            </label>
            <label className="setting-row">
              <span>
                <strong>Show avatar by default</strong>
                <small>Keep the animated signing widget visible.</small>
              </span>
              <input type="checkbox" defaultChecked />
            </label>
          </section>
          <section className="panel settings-section">
            <div className="section-icon">
              <LockKeyhole size={17} />
            </div>
            <p className="panel-kicker">Privacy</p>
            <h2>Analytics controls</h2>
            <label className="setting-row">
              <span>
                <strong>Usage telemetry</strong>
                <small>Store aggregate session counts and durations.</small>
              </span>
              <input
                type="checkbox"
                checked={telemetry}
                onChange={(event) => setTelemetry(event.target.checked)}
              />
            </label>
            <label className="setting-row">
              <span>
                <strong>Retention</strong>
                <small>Detailed events are retained for 90 days.</small>
              </span>
              <span className="setting-value">90 days</span>
            </label>
          </section>
        </div>
        <div className="settings-actions">
          <span>
            <Bell size={15} /> Changes apply to new sessions.
          </span>
          <button className="auth-submit">
            <Save size={15} />
            Save settings
          </button>
        </div>
      </PageView>
    </DashboardShell>
  );
}
