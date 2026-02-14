package com.bookmarks.bookmark;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BookmarkResponse(
        UUID id,
        String title,
        String url,
        String description,
        List<String> tags,
        BookmarkVisibility visibility,
        int savedCount,
        int sharedCount,
        Instant createdAt,
        Instant updatedAt,
        BookmarkAuthorResponse author
) {
}
