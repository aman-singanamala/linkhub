import React, { useEffect, useRef, useState } from "react";
import type { User } from "../types/auth";
import { getAvatarColor, getInitials } from "../lib/avatar";

type Props = {
  user: User | null;
  status: string;
  onRefresh: () => void;
  onSignOut: () => void;
};

export default function ProfileMenu({ user, status, onRefresh, onSignOut }: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const displayName = user?.name ?? "Guest";
  const displayHandle = user?.username ? `@${user.username}` : "Sign in to personalize";
  const initials = getInitials(displayName, "G");
  const avatarColor = getAvatarColor(user?.email ?? displayName);

  return (
    <div className="profile-menu" ref={wrapperRef}>
      <button
        className="profile-trigger"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className="avatar" style={{ background: avatarColor }}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={displayName} />
          ) : (
            initials
          )}
        </span>
        <span className="profile-meta">
          <span className="profile-name">{displayName}</span>
          <span className="profile-handle">{displayHandle}</span>
        </span>
        <span className="profile-caret">▾</span>
      </button>

      {open && (
        <div className="profile-dropdown">
          <div className="profile-header">
            <div>
              <p className="profile-title">Profile</p>
              <p className="hint">{status}</p>
            </div>
            <span className="profile-chip">Account</span>
          </div>

          <div className="profile-details">
            <div className="detail-row">
              <span>Name</span>
              <span>{displayName}</span>
            </div>
            <div className="detail-row">
              <span>Username</span>
              <span>{user?.username ?? "-"}</span>
            </div>
            <div className="detail-row">
              <span>Email</span>
              <span>{user?.email ?? "-"}</span>
            </div>
            <div className="detail-row">
              <span>Status</span>
              <span>{status}</span>
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn ghost" onClick={onRefresh}>
              Refresh
            </button>
            <button className="btn" onClick={onSignOut}>
              Sign out
            </button>
          </div>
          {!user && <p className="hint">Sign in to see full profile details.</p>}
        </div>
      )}
    </div>
  );
}
