import React from "react";
import StatusPill from "./StatusPill";

type Props = {
  showLogin: boolean;
  username: string;
  authStatus: string;
  authError: string | null;
  onUsernameChange: (value: string) => void;
  onRefresh: () => void;
  onSignOut: () => void;
};

export default function AuthPanel({
  showLogin,
  username,
  authStatus,
  authError,
  onUsernameChange,
  onRefresh,
  onSignOut
}: Props) {
  return (
    <div className="card auth-card reveal" style={{ animationDelay: "0.15s" }}>
      <div className="auth-header">
        <div>
          <h2>{showLogin ? "Sign in" : "Account"}</h2>
          <p>{showLogin ? "Pick a username and authenticate with Google." : "Your session is active."}</p>
        </div>
        <StatusPill label={authStatus} tone={showLogin ? "neutral" : "success"} />
      </div>

      {showLogin ? (
        <>
          <label className="field">
            <span>Username</span>
            <input
              value={username}
              onChange={(event) => onUsernameChange(event.target.value)}
              placeholder="yourname"
            />
          </label>
          <div id="googleButton" className="google" />
          {authError && <div className="error">{authError}</div>}
        </>
      ) : (
        <div className="actions">
          <button className="btn" onClick={onRefresh}>
            Refresh profile
          </button>
          <button className="btn ghost" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
