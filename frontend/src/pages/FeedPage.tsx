import React from "react";
import BookmarkComposer from "../components/BookmarkComposer";
import BookmarkCard from "../components/BookmarkCard";
import Loader from "../components/Loader";
import type { Bookmark, BookmarkDraft } from "../types/bookmark";

type Props = {
  bookmarks: Bookmark[];
  loading: boolean;
  error?: string | null;
  filterTag: string | null;
  trendingTags: string[];
  savedIds: Set<string>;
  sharedIds: Set<string>;
  canCreate: boolean;
  creating: boolean;
  onCreate: (draft: BookmarkDraft) => void;
  onFilterTag: (tag: string | null) => void;
  onSave: (id: string) => void;
  onShare: (id: string) => void;
};

export default function FeedPage({
  bookmarks,
  loading,
  error,
  filterTag,
  trendingTags,
  savedIds,
  sharedIds,
  canCreate,
  creating,
  onCreate,
  onFilterTag,
  onSave,
  onShare
}: Props) {
  return (
    <section className="feed-page">
      <div className="card hero-card reveal" style={{ animationDelay: "0.2s" }}>
        <p className="eyebrow">Shared knowledge</p>
        <h1>Collect, annotate, and share the links your team actually uses.</h1>
        <p className="lead">
          Sign in with Google and keep a living feed of shared bookmarks. Every bookmark can be
          saved, tagged, and re-shared like a social post.
        </p>
      </div>

      <div className="card composer-card reveal" style={{ animationDelay: "0.3s" }}>
        <div className="panel-header">
          <div>
            <h2>New bookmark</h2>
            <p>Share a link with the community feed.</p>
          </div>
          <span className="profile-chip">Publishing</span>
        </div>
        <BookmarkComposer
          disabled={!canCreate}
          busy={creating}
          onSubmit={onCreate}
        />
      </div>

      <div className="feed reveal" style={{ animationDelay: "0.4s" }}>
        <div className="feed-header">
          <div>
            <h2>Bookmark feed</h2>
            <p>Explore what the team is saving right now.</p>
          </div>
          {filterTag && (
            <button className="btn ghost" onClick={() => onFilterTag(null)}>
              Clear #{filterTag}
            </button>
          )}
        </div>

        <div className="tag-list">
          {trendingTags.map((tag) => (
            <button
              key={tag}
              className={`tag ${filterTag === tag ? "tag--active" : ""}`}
              onClick={() => onFilterTag(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>

        {loading && <Loader label="Loading bookmarks" />}
        {error && <div className="error">{error}</div>}

        {!loading && !error && (
          <>
            {bookmarks.length === 0 ? (
              <div className="empty">No public bookmarks yet. Share the first one.</div>
            ) : (
              <div className="feed-grid">
                {bookmarks.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    saved={savedIds.has(bookmark.id)}
                    shared={sharedIds.has(bookmark.id)}
                    onSave={onSave}
                    onShare={onShare}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
