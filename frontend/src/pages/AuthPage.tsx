import React from "react";
import { Link } from "react-router-dom";
import StatusPill from "../components/StatusPill";

type Props = {
  mode: "login" | "signup";
  username: string;
  authStatus: string;
  authError: string | null;
  showLogin: boolean;
  onUsernameChange: (value: string) => void;
};

export default function AuthPage({
  mode,
  username,
  authStatus,
  authError,
  showLogin,
  onUsernameChange
}: Props) {
  return (
    <section className="auth-page">
      <div className="card auth-card hero-card">
        <p className="eyebrow">{mode === "signup" ? "Create account" : "Welcome back"}</p>
        <h1>{mode === "signup" ? "Join the bookmarking network" : "Sign in to your workspace"}</h1>
        <p className="lead">
          {mode === "signup"
            ? "Use Google to create your profile and start collecting links."
            : "Use your Google account to access your saved bookmarks."}
        </p>

        {showLogin ? (
          <div className="auth-form">
            <label className="field">
              <span>Username</span>
              <input
                value={username}
                onChange={(event) => onUsernameChange(event.target.value)}
                placeholder="yourname"
              />
            </label>
            <div className="auth-status">
              <StatusPill label={authStatus} tone="neutral" />
            </div>
            <div id="googleButton" className="google" />
            {authError && <div className="error">{authError}</div>}
          </div>
        ) : (
          <div className="signed-in">
            <StatusPill label={authStatus} tone="success" />
            <p className="lead">You are signed in. Head to the feed to start sharing.</p>
            <div className="actions">
              <Link className="btn" to="/feed">Go to feed</Link>
            </div>
          </div>
        )}

        <div className="switch-auth">
          {mode === "signup" ? (
            <p>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          ) : (
            <p>
              New here? <Link to="/signup">Create an account</Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
