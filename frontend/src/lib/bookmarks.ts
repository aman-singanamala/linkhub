import type { Bookmark, BookmarkAuthor, BookmarkDraft } from "../types/bookmark";

const now = Date.now();

export const seedBookmarks: Bookmark[] = [
  {
    id: "seed-1",
    title: "API design checklist for microservices",
    url: "https://martinfowler.com/articles/microservice-testing/",
    description:
      "A practical checklist for designing resilient APIs, from versioning to error budgets.",
    tags: ["api", "microservices", "design"],
    createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
    savedCount: 24,
    sharedCount: 8,
    author: {
      name: "Maya Torres",
      username: "mayat",
      avatarUrl: null
    }
  },
  {
    id: "seed-2",
    title: "The future of social bookmarking",
    url: "https://www.nngroup.com/articles/ux-bookmarks/",
    description:
      "Notes on creating habit loops around saved content, plus UI patterns that keep it social.",
    tags: ["product", "ux", "social"],
    createdAt: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
    savedCount: 31,
    sharedCount: 12,
    author: {
      name: "Jon Patel",
      username: "jonp",
      avatarUrl: null
    }
  },
  {
    id: "seed-3",
    title: "Bookmarking as a team sport",
    url: "https://increment.com/tools/team-knowledge-management/",
    description:
      "How teams organize shared knowledge with tags, collections, and lightweight rituals.",
    tags: ["teams", "knowledge", "workflow"],
    createdAt: new Date(now - 1000 * 60 * 60 * 30).toISOString(),
    savedCount: 18,
    sharedCount: 5,
    author: {
      name: "Ella W.",
      username: "ellaw",
      avatarUrl: null
    }
  }
];

export function createBookmark(draft: BookmarkDraft, author: BookmarkAuthor): Bookmark {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `bookmark-${Date.now()}`;

  return {
    id,
    title: draft.title.trim(),
    url: draft.url.trim(),
    description: draft.description.trim() || "No description added yet.",
    tags: draft.tags,
    createdAt: new Date().toISOString(),
    savedCount: 0,
    sharedCount: 0,
    author
  };
}
