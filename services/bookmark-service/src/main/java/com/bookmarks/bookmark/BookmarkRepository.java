package com.bookmarks.bookmark;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookmarkRepository extends JpaRepository<BookmarkEntity, UUID> {

    Page<BookmarkEntity> findByVisibilityOrderByCreatedAtDesc(BookmarkVisibility visibility, Pageable pageable);

    Page<BookmarkEntity> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId, Pageable pageable);

    Page<BookmarkEntity> findByOwnerUsernameIgnoreCaseOrderByCreatedAtDesc(String ownerUsername, Pageable pageable);

    Page<BookmarkEntity> findByOwnerUsernameIgnoreCaseAndVisibilityOrderByCreatedAtDesc(String ownerUsername,
                                                                                        BookmarkVisibility visibility,
                                                                                        Pageable pageable);

    @Query("select b from BookmarkEntity b join BookmarkSaveEntity s on b.id = s.bookmarkId where s.userId = :userId order by s.createdAt desc")
    Page<BookmarkEntity> findSavedByUser(@Param("userId") UUID userId, Pageable pageable);

    @Query("select distinct b from BookmarkEntity b join b.tags t where b.visibility = :visibility and lower(t) = lower(:tag)")
    Page<BookmarkEntity> findPublicByTag(@Param("visibility") BookmarkVisibility visibility,
                                         @Param("tag") String tag,
                                         Pageable pageable);
}
