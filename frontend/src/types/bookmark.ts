export type BookmarkAuthor = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
};

export type Bookmark = {
  id: string;
  title: string;
  url: string;
  description: string;
  tags: string[];
  visibility: "PUBLIC" | "PRIVATE";
  savedCount: number;
  sharedCount: number;
  createdAt: string;
  updatedAt: string;
  author: BookmarkAuthor;
};

export type BookmarkDraft = {
  title: string;
  url: string;
  description: string;
  tags: string[];
  visibility?: "PUBLIC" | "PRIVATE";
};

export type BookmarkListResponse = {
  items: Bookmark[];
  page: number;
  size: number;
  total: number;
};
