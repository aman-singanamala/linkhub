import React, { useEffect, useState } from "react";
import type { BookmarkDraft } from "../types/bookmark";

type Props = {
  disabled?: boolean;
  busy?: boolean;
  initial?: BookmarkDraft | null;
  submitLabel?: string;
  onSubmit: (draft: BookmarkDraft) => void;
  onCancel?: () => void;
};

function cleanTag(value: string) {
  return value.trim().toLowerCase();
}

function mergeTags(existing: string[], input: string) {
  const merged = [...existing];
  input
    .split(",")
    .map(cleanTag)
    .filter(Boolean)
    .forEach((tag) => {
      if (!merged.includes(tag)) {
        merged.push(tag);
      }
    });
  return merged;
}

export default function BookmarkComposer({
  disabled,
  busy,
  initial,
  submitLabel = "Publish bookmark",
  onSubmit,
  onCancel
}: Props) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setTitle(initial.title);
      setUrl(initial.url);
      setDescription(initial.description || "");
      setTags(initial.tags ?? []);
      setTagInput("");
      setVisibility(initial.visibility ?? "PUBLIC");
      setError(null);
    }
  }, [initial]);

  function addTag(raw: string) {
    const cleaned = cleanTag(raw);
    if (!cleaned) return;
    if (tags.includes(cleaned)) return;
    setTags((prev) => [...prev, cleaned]);
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((item) => item !== tag));
  }

  function handleTagKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(tagInput);
      setTagInput("");
    } else if (event.key === "Backspace" && !tagInput) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  function handleTagChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    if (value.includes(",")) {
      const parts = value.split(",");
      parts.slice(0, -1).forEach(addTag);
      setTagInput(parts[parts.length - 1] ?? "");
    } else {
      setTagInput(value);
    }
  }

  function handleTagBlur() {
    if (tagInput) {
      addTag(tagInput);
      setTagInput("");
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (disabled) {
      setError("Sign in to publish a bookmark.");
      return;
    }

    if (!title.trim() || !url.trim()) {
      setError("Title and URL are required.");
      return;
    }

    try {
      new URL(url.trim());
    } catch {
      setError("Enter a valid URL (include https://).");
      return;
    }

    const finalTags = mergeTags(tags, tagInput);
    const draft: BookmarkDraft = {
      title: title.trim(),
      url: url.trim(),
      description: description.trim(),
      tags: finalTags,
      visibility
    };

    onSubmit(draft);
    if (!initial) {
      setTitle("");
      setUrl("");
      setTags([]);
      setTagInput("");
      setDescription("");
      setVisibility("PUBLIC");
    } else {
      setTags(finalTags);
    }
    setError(null);
  }

  return (
    <form className="composer-form" onSubmit={handleSubmit}>
      <div className="input-grid">
        <label className="field">
          <span>Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add a clean, descriptive title"
          />
        </label>
        <label className="field">
          <span>URL</span>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://"
          />
        </label>
      </div>

      <label className="field">
        <span>Notes</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Why should your team save this?"
          rows={3}
        />
      </label>

      <div className="input-grid">
        <label className="field">
          <span>Tags</span>
          <div className="tag-input">
            {tags.map((tag) => (
              <button type="button" key={tag} className="tag-chip" onClick={() => removeTag(tag)}>
                #{tag}
                <span className="tag-remove">×</span>
              </button>
            ))}
            <input
              value={tagInput}
              onChange={handleTagChange}
              onKeyDown={handleTagKeyDown}
              onBlur={handleTagBlur}
              placeholder="design, api, research"
            />
          </div>
          <span className="hint">Press enter or comma to add tags.</span>
        </label>
        <label className="field">
          <span>Visibility</span>
          <select value={visibility} onChange={(event) => setVisibility(event.target.value as "PUBLIC" | "PRIVATE")}
            className="select">
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
        </label>
      </div>

      <div className="composer-actions">
        <button className="btn" type="submit" disabled={disabled || busy}>
          {busy ? "Saving..." : submitLabel}
        </button>
        {onCancel && (
          <button className="btn ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
        {disabled && <span className="hint">Sign in to publish.</span>}
      </div>

      {error && <div className="error">{error}</div>}
    </form>
  );
}
