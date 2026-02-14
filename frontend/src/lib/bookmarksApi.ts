import { apiDelete, apiGet, apiPost, apiPut } from "./api";
import type { Bookmark, BookmarkDraft, BookmarkListResponse } from "../types/bookmark";

export async function listBookmarks(params?: {
  page?: number;
  size?: number;
  tag?: string;
}): Promise<BookmarkListResponse> {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set("page", String(params.page));
  if (params?.size !== undefined) query.set("size", String(params.size));
  if (params?.tag) query.set("tag", params.tag);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiGet<BookmarkListResponse>(`/bookmarks${suffix}`);
}

export async function listBookmarksByUsername(username: string, params?: { page?: number; size?: number }) {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set("page", String(params.page));
  if (params?.size !== undefined) query.set("size", String(params.size));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiGet<BookmarkListResponse>(`/bookmarks/users/${username}${suffix}`);
}

export async function listMyBookmarks(token: string, params?: { page?: number; size?: number }) {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set("page", String(params.page));
  if (params?.size !== undefined) query.set("size", String(params.size));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiGet<BookmarkListResponse>(`/bookmarks/me${suffix}`, token);
}

export async function listSavedBookmarks(token: string, params?: { page?: number; size?: number }) {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set("page", String(params.page));
  if (params?.size !== undefined) query.set("size", String(params.size));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiGet<BookmarkListResponse>(`/bookmarks/saved${suffix}`, token);
}

export async function createBookmark(token: string, draft: BookmarkDraft) {
  return apiPost<Bookmark>("/bookmarks", draft, token);
}

export async function updateBookmark(token: string, id: string, draft: BookmarkDraft) {
  return apiPut<Bookmark>(`/bookmarks/${id}`, draft, token);
}

export async function deleteBookmark(token: string, id: string) {
  return apiDelete<void>(`/bookmarks/${id}`, token);
}

export async function saveBookmark(token: string, id: string) {
  return apiPost<Bookmark>(`/bookmarks/${id}/save`, {}, token);
}

export async function unsaveBookmark(token: string, id: string) {
  return apiDelete<Bookmark>(`/bookmarks/${id}/save`, token);
}

export async function shareBookmark(token: string, id: string) {
  return apiPost<Bookmark>(`/bookmarks/${id}/share`, {}, token);
}

export async function unshareBookmark(token: string, id: string) {
  return apiDelete<Bookmark>(`/bookmarks/${id}/share`, token);
}
