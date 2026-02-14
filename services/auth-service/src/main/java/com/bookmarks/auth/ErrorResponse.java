package com.bookmarks.auth;

public record ErrorResponse(
        String code,
        String message
) {
}
