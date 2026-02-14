package com.bookmarks.bookmark;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BookmarkCreateRequest(
        @NotBlank @Size(max = 140) String title,
        @NotBlank @Size(max = 2048) String url,
        @Size(max = 5000) String description,
        List<@Size(max = 40) String> tags,
        BookmarkVisibility visibility
) {
}
