import React, { useState } from "react";
import BookmarkComposer from "../components/BookmarkComposer";
import BookmarkCard from "../components/BookmarkCard";
import Loader from "../components/Loader";
import type { Bookmark, BookmarkDraft } from "../types/bookmark";

type Props = {
  bookmarks: Bookmark[];
  loading: boolean;
  error?: string | null;
  savedBookmarks: Bookmark[];
  savedLoading: boolean;
  savedError?: string | null;
  savedIds: Set<string>;
  sharedIds: Set<string>;
  canEdit: boolean;
  onUpdate: (id: string, draft: BookmarkDraft) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSave: (id: string) => void;
  onShare: (id: string) => void;
};

export default function MyBookmarksPage({
  bookmarks,
  loading,
  error,
  savedBookmarks,
  savedLoading,
  savedError,
  savedIds,
  sharedIds,
  canEdit,
  onUpdate,
  onDelete,
  onSave,
  onShare
}: Props) {
  const [editing, setEditing] = useState<Bookmark | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [section, setSection] = useState<"created" | "saved">("created");

  async function handleUpdate(draft: BookmarkDraft) {
    if (!editing) return;
    setBusy(true);
    setActionError(null);
    try {
      await onUpdate(editing.id, draft);
      setEditing(null);
    } catch (err: any) {
      setActionError(err?.message ?? "Failed to update");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this bookmark?")) return;
    setDeleteBusy(id);
    setActionError(null);
    try {
      await onDelete(id);
    } catch (err: any) {
      setActionError(err?.message ?? "Failed to delete");
    } finally {
      setDeleteBusy(null);
    }
  }

  return (
    <section className="feed-page">
      <div className="card hero-card reveal" style={{ animationDelay: "0.2s" }}>
        <p className="eyebrow">Your shelf</p>
        <h1>Your saved and shared bookmarks.</h1>
        <p className="lead">
          Manage your own posts here. You can edit visibility, tags, and content.
        </p>
        {!canEdit && <div className="hint">Sign in to view and manage your bookmarks.</div>}
      </div>

      {editing && (
        <div className="card composer-card reveal" style={{ animationDelay: "0.25s" }}>
          <div className="panel-header">
            <div>
              <h2>Edit bookmark</h2>
              <p>Update the details for your community.</p>
            </div>
            <span className="profile-chip">Editing</span>
          </div>
          <BookmarkComposer
            disabled={!canEdit}
            busy={busy}
            initial={{
              title: editing.title,
              url: editing.url,
              description: editing.description,
              tags: editing.tags,
              visibility: editing.visibility
            }}
            submitLabel="Update bookmark"
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      <div className="feed reveal" style={{ animationDelay: "0.3s" }}>
        <div className="feed-header">
          <div>
            <h2>{section === "created" ? "My bookmarks" : "Saved bookmarks"}</h2>
            <p>
              {section === "created"
                ? "Edit or delete the bookmarks you created."
                : "Bookmarks you saved from the community feed."}
            </p>
          </div>
          <div className="segment">
            <button
              className={`segment-btn ${section === "created" ? "active" : ""}`}
              onClick={() => setSection("created")}
            >
              My posts
            </button>
            <button
              className={`segment-btn ${section === "saved" ? "active" : ""}`}
              onClick={() => setSection("saved")}
            >
              Saved
            </button>
          </div>
        </div>

        {actionError && <div className="error">{actionError}</div>}
        {section === "created" && loading && <Loader label="Loading your bookmarks" />}
        {section === "created" && error && <div className="error">{error}</div>}
        {section === "saved" && savedLoading && <Loader label="Loading saved bookmarks" />}
        {section === "saved" && savedError && <div className="error">{savedError}</div>}

        {section === "created" && !loading && !error && (
          <>
            {bookmarks.length === 0 ? (
              <div className="empty">You have not shared any bookmarks yet.</div>
            ) : (
              <div className="feed-grid">
                {bookmarks.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    canEdit={canEdit}
                    saved={savedIds.has(bookmark.id)}
                    shared={sharedIds.has(bookmark.id)}
                    onSave={onSave}
                    onShare={onShare}
                    onEdit={() => setEditing(bookmark)}
                    onDelete={(id) => void handleDelete(id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {section === "saved" && !savedLoading && !savedError && (
          <>
            {savedBookmarks.length === 0 ? (
              <div className="empty">No saved bookmarks yet.</div>
            ) : (
              <div className="feed-grid">
                {savedBookmarks.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    saved
                    shared={sharedIds.has(bookmark.id)}
                    onSave={onSave}
                    onShare={onShare}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {deleteBusy && <div className="hint">Deleting bookmark...</div>}
      </div>
    </section>
  );
}
