package com.bookmarks.bookmark;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BookmarkSaveRepository extends JpaRepository<BookmarkSaveEntity, UUID> {
    boolean existsByBookmarkIdAndUserId(UUID bookmarkId, UUID userId);
    Optional<BookmarkSaveEntity> findByBookmarkIdAndUserId(UUID bookmarkId, UUID userId);
}
