import React from "react";
import { Link } from "react-router-dom";
import type { Bookmark } from "../types/bookmark";
import { getAvatarColor, getInitials } from "../lib/avatar";

type Props = {
  bookmark: Bookmark;
  canEdit?: boolean;
  saved?: boolean;
  shared?: boolean;
  onSave: (id: string) => void;
  onShare: (id: string) => void;
  onEdit?: (bookmark: Bookmark) => void;
  onDelete?: (id: string) => void;
};

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export default function BookmarkCard({
  bookmark,
  canEdit,
  saved,
  shared,
  onSave,
  onShare,
  onEdit,
  onDelete
}: Props) {
  const initials = getInitials(bookmark.author.name, "B");
  const avatarColor = getAvatarColor(bookmark.author.username);

  return (
    <article className="bookmark-card">
      <div className="bookmark-top">
        <div className="author">
          <span className="avatar avatar--small" style={{ background: avatarColor }}>
            {bookmark.author.avatarUrl ? (
              <img src={bookmark.author.avatarUrl} alt={bookmark.author.name} />
            ) : (
              initials
            )}
          </span>
          <div>
            <p className="author-name">{bookmark.author.name}</p>
            <p className="author-handle">
              <Link to={`/users/${bookmark.author.username}`}>@{bookmark.author.username}</Link>
            </p>
          </div>
        </div>
        <span className="bookmark-date">{formatDate(bookmark.createdAt)}</span>
      </div>

      <h3 className="bookmark-title">
        <a href={bookmark.url} target="_blank" rel="noreferrer">
          {bookmark.title}
        </a>
      </h3>
      <p className="bookmark-domain">{getDomain(bookmark.url)}</p>
      {bookmark.visibility === "PRIVATE" && <span className="visibility">Private</span>}
      <p className="bookmark-desc">{bookmark.description}</p>

      <div className="tag-row">
        {bookmark.tags.map((tag) => (
          <span key={tag} className="tag">
            #{tag}
          </span>
        ))}
      </div>

      <div className="bookmark-actions">
        <button className={`action-btn ${saved ? "active" : ""}`} onClick={() => onSave(bookmark.id)}>
          <span>{saved ? "Unsave" : "Save"}</span>
          <span className="count">{bookmark.savedCount}</span>
        </button>
        <button className={`action-btn ghost ${shared ? "active" : ""}`} onClick={() => onShare(bookmark.id)}>
          <span>{shared ? "Unshare" : "Share"}</span>
          <span className="count">{bookmark.sharedCount}</span>
        </button>
        {canEdit && (
          <div className="owner-actions">
            <button className="action-btn ghost" onClick={() => onEdit?.(bookmark)}>
              Edit
            </button>
            <button className="action-btn danger" onClick={() => onDelete?.(bookmark.id)}>
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
