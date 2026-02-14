import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BookmarkCard from "../components/BookmarkCard";
import Loader from "../components/Loader";
import { listBookmarksByUsername } from "../lib/bookmarksApi";
import type { Bookmark } from "../types/bookmark";

type Props = {
  savedIds: Set<string>;
  sharedIds: Set<string>;
  onSave: (id: string) => void;
  onShare: (id: string) => void;
};

type State = {
  items: Bookmark[];
  loading: boolean;
  error: string | null;
};

export default function UserBookmarksPage({ savedIds, sharedIds, onSave, onShare }: Props) {
  const { username } = useParams();
  const [state, setState] = useState<State>({ items: [], loading: true, error: null });

  useEffect(() => {
    if (!username) return;
    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    listBookmarksByUsername(username)
      .then((data) => {
        if (!active) return;
        setState({ items: data.items, loading: false, error: null });
      })
      .catch((err: any) => {
        if (!active) return;
        setState({ items: [], loading: false, error: err?.message ?? "Failed to load" });
      });
    return () => {
      active = false;
    };
  }, [username]);

  return (
    <section className="feed-page">
      <div className="card hero-card reveal" style={{ animationDelay: "0.2s" }}>
        <p className="eyebrow">Community profile</p>
        <h1>@{username}</h1>
        <p className="lead">Public bookmarks shared by this user.</p>
      </div>

      {state.loading && <Loader label="Loading bookmarks" />}
      {state.error && <div className="error">{state.error}</div>}

      {!state.loading && !state.error && (
        <>
          {state.items.length === 0 ? (
            <div className="empty">No public bookmarks yet.</div>
          ) : (
            <div className="feed-grid">
              {state.items.map((bookmark) => (
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
    </section>
  );
}
