package com.bookmarks.auth;

public record GoogleTokenPayload(
        String subject,
        String email,
        String name,
        String picture
) {
}
