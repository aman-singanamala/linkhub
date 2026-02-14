package com.bookmarks.bookmark;

import java.util.UUID;

public record BookmarkAuthorResponse(
        UUID id,
        String name,
        String username,
        String avatarUrl
) {
}
