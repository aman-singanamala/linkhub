package com.bookmarks.user;

import java.time.Instant;
import java.util.UUID;

public record UserProfileResponse(
        UUID id,
        String email,
        String name,
        String username,
        String bio,
        String avatarUrl,
        Instant createdAt,
        Instant updatedAt
) {
}
