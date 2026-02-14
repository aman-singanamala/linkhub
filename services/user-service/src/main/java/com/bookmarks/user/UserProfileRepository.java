package com.bookmarks.user;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserProfileRepository extends JpaRepository<UserProfileEntity, UUID> {
    boolean existsByUsername(String username);
    boolean existsByUsernameAndIdNot(String username, UUID id);
}
