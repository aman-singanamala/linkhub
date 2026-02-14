package com.bookmarks.auth;

import java.util.UUID;

public record UserDto(
        UUID id,
        String email,
        String name,
        String username,
        String avatarUrl
) {
}
