package com.bookmarks.bookmark;

import java.util.List;

import jakarta.validation.constraints.Size;

public record BookmarkUpdateRequest(
        @Size(max = 140) String title,
        @Size(max = 2048) String url,
        @Size(max = 5000) String description,
        List<@Size(max = 40) String> tags,
        BookmarkVisibility visibility
) {
}
