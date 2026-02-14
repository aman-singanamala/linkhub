package com.bookmarks.user;

import jakarta.validation.constraints.Size;

public record UserProfileUpdateRequest(
        @Size(max = 80) String name,
        @Size(max = 30) String username,
        @Size(max = 280) String bio,
        @Size(max = 500) String avatarUrl
) {
}
