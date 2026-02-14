package com.bookmarks.bookmark;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BookmarkShareRepository extends JpaRepository<BookmarkShareEntity, UUID> {
    boolean existsByBookmarkIdAndUserId(UUID bookmarkId, UUID userId);
    Optional<BookmarkShareEntity> findByBookmarkIdAndUserId(UUID bookmarkId, UUID userId);
}
