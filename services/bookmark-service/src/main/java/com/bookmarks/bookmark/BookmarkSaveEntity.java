package com.bookmarks.bookmark;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "bookmark_saves",
       uniqueConstraints = @UniqueConstraint(columnNames = {"bookmark_id", "user_id"}))
public class BookmarkSaveEntity {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "bookmark_id", nullable = false)
    private UUID bookmarkId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getBookmarkId() {
        return bookmarkId;
    }

    public void setBookmarkId(UUID bookmarkId) {
        this.bookmarkId = bookmarkId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
