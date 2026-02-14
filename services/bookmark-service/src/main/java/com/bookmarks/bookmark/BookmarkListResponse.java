package com.bookmarks.bookmark;

import java.util.List;

public record BookmarkListResponse(
        List<BookmarkResponse> items,
        int page,
        int size,
        long total
) {
}
