import React, { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, NavLink, Route, Routes, useLocation } from "react-router-dom";
import ProfileMenu from "./components/ProfileMenu";
import AuthPanel from "./components/AuthPanel";
import FeedPage from "./pages/FeedPage";
import MyBookmarksPage from "./pages/MyBookmarksPage";
import UserBookmarksPage from "./pages/UserBookmarksPage";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import { loginWithGoogle, fetchMe } from "./lib/auth";
import {
  createBookmark,
  deleteBookmark,
  listBookmarks,
  listMyBookmarks,
  listSavedBookmarks,
  saveBookmark,
  shareBookmark,
  unsaveBookmark,
  unshareBookmark,
  updateBookmark
} from "./lib/bookmarksApi";
import type { AuthResponse, User } from "./types/auth";
import type { Bookmark, BookmarkDraft } from "./types/bookmark";

const GOOGLE_SCRIPT = "https://accounts.google.com/gsi/client";
const USERNAME_STORAGE_KEY = "draftUsername";
const SHARED_STORAGE_KEY = "sharedBookmarkIds";

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src='${GOOGLE_SCRIPT}']`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google script")));
      return;
    }
    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.body.appendChild(script);
  });
}

type FeedState = {
  items: Bookmark[];
  loading: boolean;
  error: string | null;
};

function AppShell() {
  const [username, setUsername] = useState(
    () => (typeof localStorage === "undefined" ? "yourname" : localStorage.getItem(USERNAME_STORAGE_KEY) || "yourname")
  );
  const usernameRef = useRef(username);
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState("Signed out");
  const [authError, setAuthError] = useState<string | null>(null);
  const [feedState, setFeedState] = useState<FeedState>({ items: [], loading: true, error: null });
  const [myState, setMyState] = useState<FeedState>({ items: [], loading: false, error: null });
  const [savedState, setSavedState] = useState<FeedState>({ items: [], loading: false, error: null });
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [sharedIds, setSharedIds] = useState<Set<string>>(() => {
    if (typeof localStorage === "undefined") return new Set();
    const raw = localStorage.getItem(SHARED_STORAGE_KEY);
    if (!raw) return new Set();
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    } catch {
      return new Set();
    }
    return new Set();
  });

  const location = useLocation();
  const isAuthRoute = location.pathname === "/login" || location.pathname === "/signup";
  const showSideAuth = !isAuthRoute && location.pathname !== "/";

  const token = auth?.accessToken ?? (typeof localStorage === "undefined" ? "" : localStorage.getItem("accessToken") ?? "");
  const profile = user ?? auth?.user ?? null;
  const showLogin = !profile;

  useEffect(() => {
    usernameRef.current = username;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(USERNAME_STORAGE_KEY, username);
    }
  }, [username]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(Array.from(sharedIds)));
  }, [sharedIds]);


  useEffect(() => {
    if (!showLogin) return;
    let canceled = false;

    loadGoogleScript()
      .then(() => {
        if (canceled) return;
        const target = document.getElementById("googleButton");
        if (!target) return;
        target.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: async (response: { credential: string }) => {
            setAuthError(null);
            setAuthStatus("Signing you in...");
            try {
              const authResponse = await loginWithGoogle(response.credential, usernameRef.current.trim());
              if (typeof localStorage !== "undefined") {
                localStorage.setItem("accessToken", authResponse.accessToken);
              }
              setAuth(authResponse);
              setAuthStatus("Loading your profile...");
              const me = await fetchMe(authResponse.accessToken);
              setUser(me);
              setAuthStatus("Signed in");
              await loadMyBookmarks(authResponse.accessToken);
              await loadSaved(authResponse.accessToken);
            } catch (err: any) {
              setAuthStatus("Failed");
              setAuthError(err?.message ?? "Login failed");
            }
          }
        });
        window.google.accounts.id.renderButton(target, {
          theme: "outline",
          size: "large",
          type: "standard",
          text: "continue_with",
          shape: "pill"
        });
      })
      .catch((err) => {
        setAuthError(err.message);
      });

    return () => {
      canceled = true;
    };
  }, [showLogin, location.pathname]);

  useEffect(() => {
    if (!token || user) return;
    let active = true;
    setAuthStatus("Loading your profile...");
    fetchMe(token)
      .then((me) => {
        if (!active) return;
        setUser(me);
        setAuthStatus("Signed in");
      })
      .catch((err: any) => {
        if (!active) return;
        setAuthStatus("Failed");
        setAuthError(err?.message ?? "Failed to load profile");
      });
    return () => {
      active = false;
    };
  }, [token, user]);

  useEffect(() => {
    loadFeed();
  }, []);

  useEffect(() => {
    if (!token) {
      setMyState({ items: [], loading: false, error: null });
      setSavedState({ items: [], loading: false, error: null });
      return;
    }
    loadMyBookmarks(token);
    loadSaved(token);
  }, [token]);

  const trendingTags = useMemo(() => {
    const counts = new Map<string, number>();
    feedState.items.forEach((bookmark) => {
      bookmark.tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [feedState.items]);

  const savedIds = useMemo(() => new Set(savedState.items.map((item) => item.id)), [savedState.items]);

  const filteredBookmarks = useMemo(() => {
    if (!filterTag) return feedState.items;
    return feedState.items.filter((bookmark) => bookmark.tags.includes(filterTag));
  }, [feedState.items, filterTag]);

  async function loadFeed() {
    setFeedState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await listBookmarks({ page: 0, size: 50 });
      setFeedState({ items: data.items, loading: false, error: null });
    } catch (err: any) {
      setFeedState({ items: [], loading: false, error: err?.message ?? "Failed to load feed" });
    }
  }

  async function loadMyBookmarks(activeToken: string) {
    setMyState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await listMyBookmarks(activeToken, { page: 0, size: 50 });
      setMyState({ items: data.items, loading: false, error: null });
    } catch (err: any) {
      setMyState({ items: [], loading: false, error: err?.message ?? "Failed to load bookmarks" });
    }
  }

  async function loadSaved(activeToken: string) {
    setSavedState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await listSavedBookmarks(activeToken, { page: 0, size: 50 });
      setSavedState({ items: data.items, loading: false, error: null });
    } catch (err: any) {
      setSavedState({ items: [], loading: false, error: err?.message ?? "Failed to load saved bookmarks" });
    }
  }

  async function refreshProfile() {
    setAuthError(null);
    if (!token) {
      setAuthError("Please sign in first.");
      return;
    }
    try {
      setAuthStatus("Refreshing profile...");
      const me = await fetchMe(token);
      setUser(me);
      setAuthStatus("Signed in");
    } catch (err: any) {
      setAuthStatus("Failed");
      setAuthError(err?.message ?? "Request failed");
    }
  }

  function signOut() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem(SHARED_STORAGE_KEY);
    }
    setAuth(null);
    setUser(null);
    setAuthStatus("Signed out");
    setAuthError(null);
    setSharedIds(new Set());
  }

  async function handleCreateBookmark(draft: BookmarkDraft) {
    if (!token) {
      setToast("Please sign in to publish.");
      return;
    }
    setCreating(true);
    try {
      const created = await createBookmark(token, draft);
      setFeedState((prev) => ({
        ...prev,
        items: created.visibility === "PUBLIC" ? [created, ...prev.items] : prev.items
      }));
      setMyState((prev) => ({ ...prev, items: [created, ...prev.items] }));
      setToast("Bookmark published.");
    } catch (err: any) {
      setToast(err?.message ?? "Failed to publish");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdateBookmark(id: string, draft: BookmarkDraft) {
    if (!token) {
      setToast("Please sign in to edit.");
      return;
    }
    const updated = await updateBookmark(token, id, draft);
    setFeedState((prev) => ({
      ...prev,
      items:
        updated.visibility === "PUBLIC"
          ? prev.items.some((item) => item.id === id)
            ? prev.items.map((item) => (item.id === id ? updated : item))
            : [updated, ...prev.items]
          : prev.items.filter((item) => item.id !== id)
    }));
    setMyState((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? updated : item))
    }));
    setSavedState((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? updated : item))
    }));
    setToast("Bookmark updated.");
  }

  async function handleDeleteBookmark(id: string) {
    if (!token) {
      setToast("Please sign in to delete.");
      return;
    }
    await deleteBookmark(token, id);
    setFeedState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id)
    }));
    setMyState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id)
    }));
    setSavedState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id)
    }));
    setToast("Bookmark deleted.");
  }

  async function handleSaveBookmark(id: string) {
    if (!token) {
      setToast("Please sign in to save.");
      return;
    }
    try {
      const updated = savedIds.has(id)
        ? await unsaveBookmark(token, id)
        : await saveBookmark(token, id);
      setFeedState((prev) => ({
        ...prev,
        items: prev.items.map((item) => (item.id === id ? updated : item))
      }));
      setMyState((prev) => ({
        ...prev,
        items: prev.items.map((item) => (item.id === id ? updated : item))
      }));
      setSavedState((prev) => {
        const exists = prev.items.some((item) => item.id === id);
        if (savedIds.has(id)) {
          return { ...prev, items: prev.items.filter((item) => item.id !== id) };
        }
        if (!exists) {
          return { ...prev, items: [updated, ...prev.items] };
        }
        return prev;
      });
      setToast(savedIds.has(id) ? "Removed from saved." : "Saved to your list.");
    } catch (err: any) {
      setToast(err?.message ?? "Failed to save");
    }
  }

  async function handleShareBookmark(id: string) {
    if (!token) {
      setToast("Please sign in to share.");
      return;
    }
    try {
      const updated = sharedIds.has(id)
        ? await unshareBookmark(token, id)
        : await shareBookmark(token, id);
      setFeedState((prev) => ({
        ...prev,
        items: prev.items.map((item) => (item.id === id ? updated : item))
      }));
      setMyState((prev) => ({
        ...prev,
        items: prev.items.map((item) => (item.id === id ? updated : item))
      }));
      setSharedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
      if (!sharedIds.has(id)) {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(`${updated.title}\n${updated.url}`);
          setToast("Share link copied.");
        } else {
          setToast("Share recorded.");
        }
      } else {
        setToast("Share removed.");
      }
    } catch (err: any) {
      setToast(err?.message ?? "Failed to share");
    }
  }

  return (
    <div className="page">
      <div className="backdrop" />
      <header className="topbar reveal" style={{ animationDelay: "0.1s" }}>
        <div className="brand">
          <span className="logo">Bookmarking Studio</span>
          <span className="tagline">A social home for your team research</span>
          <nav className="nav">
            <NavLink end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} to="/">
              Home
            </NavLink>
            <NavLink className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} to="/feed">
              Explore
            </NavLink>
            <NavLink className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} to="/me">
              My Bookmarks
            </NavLink>
            {showLogin && (
              <NavLink className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} to="/login">
                Login
              </NavLink>
            )}
          </nav>
        </div>
        <div className="top-actions">
          <ProfileMenu
            user={profile}
            status={authStatus}
            onRefresh={refreshProfile}
            onSignOut={signOut}
          />
        </div>
      </header>

      <div className={`layout ${showSideAuth ? "" : "layout--single"}`}>
        <div className="layout-main">
          <Routes>
            <Route
              path="/"
              element={
                <LandingPage />
              }
            />
            <Route
              path="/feed"
              element={
                <FeedPage
                  bookmarks={filteredBookmarks}
                  loading={feedState.loading}
                  error={feedState.error}
                  filterTag={filterTag}
                  trendingTags={trendingTags}
                  savedIds={savedIds}
                  sharedIds={sharedIds}
                  canCreate={!!profile}
                  creating={creating}
                  onCreate={handleCreateBookmark}
                  onFilterTag={setFilterTag}
                  onSave={handleSaveBookmark}
                  onShare={handleShareBookmark}
                />
              }
            />
            <Route
              path="/login"
              element={
                <AuthPage
                  mode="login"
                  username={username}
                  authStatus={authStatus}
                  authError={authError}
                  showLogin={showLogin}
                  onUsernameChange={setUsername}
                />
              }
            />
            <Route
              path="/signup"
              element={
                <AuthPage
                  mode="signup"
                  username={username}
                  authStatus={authStatus}
                  authError={authError}
                  showLogin={showLogin}
                  onUsernameChange={setUsername}
                />
              }
            />
            <Route
              path="/me"
              element={
                <MyBookmarksPage
                  bookmarks={myState.items}
                  loading={myState.loading}
                  error={myState.error}
                  savedBookmarks={savedState.items}
                  savedLoading={savedState.loading}
                  savedError={savedState.error}
                  savedIds={savedIds}
                  sharedIds={sharedIds}
                  canEdit={!!profile}
                  onUpdate={handleUpdateBookmark}
                  onDelete={handleDeleteBookmark}
                  onSave={handleSaveBookmark}
                  onShare={handleShareBookmark}
                />
              }
            />
            <Route
              path="/users/:username"
              element={
                <UserBookmarksPage
                  savedIds={savedIds}
                  sharedIds={sharedIds}
                  onSave={handleSaveBookmark}
                  onShare={handleShareBookmark}
                />
              }
            />
          </Routes>
        </div>
        {showSideAuth && (
          <AuthPanel
            showLogin={showLogin}
            username={username}
            authStatus={authStatus}
            authError={authError}
            onUsernameChange={setUsername}
            onRefresh={refreshProfile}
            onSignOut={signOut}
          />
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
