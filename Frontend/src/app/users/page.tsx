import { Search, UserPlus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { MetricRow, PageView } from "@/components/page-view";
const users = [
  {
    name: "Alex Morgan",
    email: "alex@example.com",
    role: "Administrator",
    mfa: "Enabled",
    joined: "May 12, 2026",
  },
  {
    name: "Priya Shah",
    email: "priya@example.com",
    role: "User",
    mfa: "Enabled",
    joined: "Jun 04, 2026",
  },
  {
    name: "Daniel Kim",
    email: "daniel@example.com",
    role: "User",
    mfa: "Not enabled",
    joined: "Jul 18, 2026",
  },
];
export default function UsersPage() {
  return (
    <DashboardShell active="Users">
      <PageView
        eyebrow="Admin / Users"
        title="People using Glossia"
        description="Review accounts, access roles, and security posture across the workspace."
      >
        <MetricRow
          items={[
            { label: "Total users", value: "128", note: "+12 this month" },
            {
              label: "Active this month",
              value: "94",
              note: "73% of all accounts",
            },
            {
              label: "MFA coverage",
              value: "81%",
              note: "Security enrollment",
            },
            { label: "Pending review", value: "3", note: "Require attention" },
          ]}
        />
        <section className="panel sessions-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Directory</p>
              <h2>Account directory</h2>
            </div>
            <div className="heading-controls">
              <button className="filter-button">
                <Search size={14} />
                Search
              </button>
              <button className="date-control">
                <UserPlus size={14} />
                Invite user
              </button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>MFA</th>
                  <th>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.email}>
                    <td>
                      <div className="platform-cell">
                        <span className="avatar">
                          {user.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </span>
                        <div>
                          <strong>{user.name}</strong>
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{user.role}</td>
                    <td>{user.mfa}</td>
                    <td>{user.joined}</td>
                    <td>
                      <span className="status-pill status-complete">
                        <span />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </PageView>
    </DashboardShell>
  );
}
