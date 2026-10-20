"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { ApiRequestError, login, loginWithMfa } from "@/lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (challengeToken) {
        const response = await loginWithMfa(challengeToken, code);
        window.localStorage.setItem(
          "glossia_access_token",
          response.access_token,
        );
        window.location.href = "/";
        return;
      }
      const response = await login(username, password);
      if (response.mfa_required && response.mfa_challenge_token) {
        setChallengeToken(response.mfa_challenge_token);
      } else if (response.access_token) {
        window.localStorage.setItem(
          "glossia_access_token",
          response.access_token,
        );
        window.location.href = "/";
      } else {
        setError("The server did not return an access token.");
      }
    } catch (caughtError) {
      if (
        caughtError instanceof ApiRequestError &&
        caughtError.status === 401
      ) {
        setError("Invalid username or password.");
      } else if (caughtError instanceof ApiRequestError) {
        setError(caughtError.message);
      } else {
        setError(
          "The analytics API is unavailable. Start Flask on port 5000 and try again.",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="brand-lockup">
          <span className="brand-dot" />
          <span>Glossia</span>
          <span className="brand-label">ANALYTICS</span>
        </div>
        <div className="auth-heading">
          <p className="eyebrow">Private workspace</p>
          <h1>{challengeToken ? "Verify your sign-in." : "Welcome back."}</h1>
          <p>
            {challengeToken
              ? "Enter the code from your authenticator app."
              : "Sign in to see your usage and conversion activity."}
          </p>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {!challengeToken ? (
            <>
              <label>
                Username
                <input
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
            </>
          ) : (
            <label>
              Authenticator code
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
              />
            </label>
          )}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button className="auth-submit" disabled={busy}>
            {busy
              ? "Signing in…"
              : challengeToken
                ? "Verify and continue"
                : "Continue"}
            <ArrowRight size={16} />
          </button>
        </form>
        <div className="auth-note">
          <span>
            <LockKeyhole size={14} /> Protected by Glossia security
          </span>
          <span>
            <ShieldCheck size={14} /> MFA supported
          </span>
        </div>
      </section>
    </main>
  );
}
