package com.bookmarks.bookmark;

import java.net.URI;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BookmarkService {

    private final BookmarkRepository repository;
    private final BookmarkSaveRepository saveRepository;
    private final BookmarkShareRepository shareRepository;

    public BookmarkService(BookmarkRepository repository,
                           BookmarkSaveRepository saveRepository,
                           BookmarkShareRepository shareRepository) {
        this.repository = repository;
        this.saveRepository = saveRepository;
        this.shareRepository = shareRepository;
    }

    @Transactional(readOnly = true)
    public BookmarkListResponse listPublic(int page, int size, String tag) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<BookmarkEntity> results = tag == null || tag.isBlank()
                ? repository.findByVisibilityOrderByCreatedAtDesc(BookmarkVisibility.PUBLIC, pageable)
                : repository.findPublicByTag(BookmarkVisibility.PUBLIC, tag.trim(), pageable);
        return toListResponse(results, page, size);
    }

    @Transactional(readOnly = true)
    public BookmarkListResponse listForOwner(Jwt jwt, int page, int size) {
        UUID ownerId = parseUserId(jwt);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<BookmarkEntity> results = repository.findByOwnerIdOrderByCreatedAtDesc(ownerId, pageable);
        return toListResponse(results, page, size);
    }

    @Transactional(readOnly = true)
    public BookmarkListResponse listSaved(Jwt jwt, int page, int size) {
        UUID userId = parseUserId(jwt);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<BookmarkEntity> results = repository.findSavedByUser(userId, pageable);
        return toListResponse(results, page, size);
    }

    @Transactional(readOnly = true)
    public BookmarkListResponse listForUsername(String username, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<BookmarkEntity> results = repository
                .findByOwnerUsernameIgnoreCaseAndVisibilityOrderByCreatedAtDesc(username, BookmarkVisibility.PUBLIC, pageable);
        return toListResponse(results, page, size);
    }

    @Transactional(readOnly = true)
    public BookmarkResponse getById(UUID id, Jwt jwt, Authentication authentication) {
        BookmarkEntity entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bookmark not found"));
        if (entity.getVisibility() == BookmarkVisibility.PRIVATE) {
            if (jwt == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bookmark is private");
            }
            UUID userId = parseUserId(jwt);
            if (!entity.getOwnerId().equals(userId) && !isAdmin(authentication)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
            }
        }
        return toResponse(entity);
    }

    @Transactional
    public BookmarkResponse create(BookmarkCreateRequest request, Jwt jwt, Authentication authentication) {
        requireWriterRole(authentication);
        UUID ownerId = parseUserId(jwt);
        BookmarkEntity entity = new BookmarkEntity();
        entity.setOwnerId(ownerId);
        entity.setOwnerName(defaultIfBlank(jwt.getClaimAsString("name"), "User"));
        entity.setOwnerUsername(resolveUsername(jwt));
        entity.setOwnerAvatarUrl(jwt.getClaimAsString("avatarUrl"));
        entity.setTitle(requireNonBlank(request.title(), "title"));
        entity.setUrl(validateUrl(requireNonBlank(request.url(), "url")));
        entity.setDescription(safeText(request.description()));
        entity.setVisibility(request.visibility() != null ? request.visibility() : BookmarkVisibility.PUBLIC);
        entity.setTags(normalizeTags(request.tags()));
        entity = repository.save(entity);
        return toResponse(entity);
    }

    @Transactional
    public BookmarkResponse update(UUID id, BookmarkUpdateRequest request, Jwt jwt, Authentication authentication) {
        requireWriterRole(authentication);
        BookmarkEntity entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bookmark not found"));
        enforceOwnerOrAdmin(entity, jwt, authentication);

        boolean changed = false;
        if (request.title() != null) {
            entity.setTitle(requireNonBlank(request.title(), "title"));
            changed = true;
        }
        if (request.url() != null) {
            entity.setUrl(validateUrl(requireNonBlank(request.url(), "url")));
            changed = true;
        }
        if (request.description() != null) {
            entity.setDescription(safeText(request.description()));
            changed = true;
        }
        if (request.tags() != null) {
            entity.setTags(normalizeTags(request.tags()));
            changed = true;
        }
        if (request.visibility() != null) {
            entity.setVisibility(request.visibility());
            changed = true;
        }

        if (changed) {
            entity = repository.save(entity);
        }
        return toResponse(entity);
    }

    @Transactional
    public void delete(UUID id, Jwt jwt, Authentication authentication) {
        requireWriterRole(authentication);
        BookmarkEntity entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bookmark not found"));
        enforceOwnerOrAdmin(entity, jwt, authentication);
        repository.delete(entity);
    }

    @Transactional
    public BookmarkResponse recordSave(UUID id, Jwt jwt, Authentication authentication) {
        UUID userId = parseUserId(jwt);
        BookmarkEntity entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bookmark not found"));
        if (entity.getVisibility() == BookmarkVisibility.PRIVATE) {
            if (!entity.getOwnerId().equals(userId) && !isAdmin(authentication)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
            }
        }
        if (!saveRepository.existsByBookmarkIdAndUserId(id, userId)) {
            BookmarkSaveEntity save = new BookmarkSaveEntity();
            save.setBookmarkId(id);
            save.setUserId(userId);
            saveRepository.save(save);
            entity.setSavedCount(entity.getSavedCount() + 1);
            entity = repository.save(entity);
        }
        return toResponse(entity);
    }

    @Transactional
    public BookmarkResponse recordShare(UUID id, Jwt jwt, Authentication authentication) {
        UUID userId = parseUserId(jwt);
        BookmarkEntity entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bookmark not found"));
        if (entity.getVisibility() == BookmarkVisibility.PRIVATE) {
            if (!entity.getOwnerId().equals(userId) && !isAdmin(authentication)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
            }
        }
        if (!shareRepository.existsByBookmarkIdAndUserId(id, userId)) {
            BookmarkShareEntity share = new BookmarkShareEntity();
            share.setBookmarkId(id);
            share.setUserId(userId);
            shareRepository.save(share);
            entity.setSharedCount(entity.getSharedCount() + 1);
            entity = repository.save(entity);
        }
        return toResponse(entity);
    }

    @Transactional
    public BookmarkResponse removeSave(UUID id, Jwt jwt, Authentication authentication) {
        UUID userId = parseUserId(jwt);
        BookmarkEntity entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bookmark not found"));
        if (entity.getVisibility() == BookmarkVisibility.PRIVATE) {
            if (!entity.getOwnerId().equals(userId) && !isAdmin(authentication)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
            }
        }
        saveRepository.findByBookmarkIdAndUserId(id, userId).ifPresent(save -> {
            saveRepository.delete(save);
            int next = Math.max(0, entity.getSavedCount() - 1);
            entity.setSavedCount(next);
            repository.save(entity);
        });
        return toResponse(entity);
    }

    @Transactional
    public BookmarkResponse removeShare(UUID id, Jwt jwt, Authentication authentication) {
        UUID userId = parseUserId(jwt);
        BookmarkEntity entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bookmark not found"));
        if (entity.getVisibility() == BookmarkVisibility.PRIVATE) {
            if (!entity.getOwnerId().equals(userId) && !isAdmin(authentication)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
            }
        }
        shareRepository.findByBookmarkIdAndUserId(id, userId).ifPresent(share -> {
            shareRepository.delete(share);
            int next = Math.max(0, entity.getSharedCount() - 1);
            entity.setSharedCount(next);
            repository.save(entity);
        });
        return toResponse(entity);
    }

    private BookmarkListResponse toListResponse(Page<BookmarkEntity> results, int page, int size) {
        List<BookmarkResponse> items = results.getContent().stream()
                .map(this::toResponse)
                .toList();
        return new BookmarkListResponse(items, results.getNumber(), results.getSize(), results.getTotalElements());
    }

    private BookmarkResponse toResponse(BookmarkEntity entity) {
        return new BookmarkResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getUrl(),
                entity.getDescription(),
                new ArrayList<>(entity.getTags()),
                entity.getVisibility(),
                entity.getSavedCount(),
                entity.getSharedCount(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                new BookmarkAuthorResponse(
                        entity.getOwnerId(),
                        entity.getOwnerName(),
                        entity.getOwnerUsername(),
                        entity.getOwnerAvatarUrl()
                )
        );
    }

    private void enforceOwnerOrAdmin(BookmarkEntity entity, Jwt jwt, Authentication authentication) {
        UUID userId = parseUserId(jwt);
        if (!entity.getOwnerId().equals(userId) && !isAdmin(authentication)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
    }

    private boolean isAdmin(Authentication authentication) {
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
    }

    private void requireWriterRole(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        boolean allowed = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_USER") || auth.getAuthority().equals("ROLE_ADMIN"));
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Insufficient role");
        }
    }

    private UUID parseUserId(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getSubject());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token subject");
        }
    }

    private String resolveUsername(Jwt jwt) {
        String username = jwt.getClaimAsString("username");
        if (username != null && !username.isBlank()) {
            return username.trim().toLowerCase(Locale.ROOT);
        }
        String email = jwt.getClaimAsString("email");
        if (email != null && email.contains("@")) {
            return email.substring(0, email.indexOf('@')).toLowerCase(Locale.ROOT);
        }
        return "user";
    }

    private String requireNonBlank(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
        }
        return value.trim();
    }

    private String validateUrl(String value) {
        try {
            URI uri = URI.create(value.trim());
            if (uri.getScheme() == null || uri.getHost() == null) {
                throw new IllegalArgumentException("Invalid URL");
            }
            return uri.toString();
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid URL");
        }
    }

    private String safeText(String value) {
        if (value == null) {
            return "";
        }
        return value.trim();
    }

    private Set<String> normalizeTags(List<String> tags) {
        Set<String> normalized = new LinkedHashSet<>();
        if (tags == null || tags.isEmpty()) {
            return normalized;
        }
        for (String tag : tags) {
            if (tag == null) {
                continue;
            }
            String cleaned = tag.trim().toLowerCase(Locale.ROOT);
            if (!cleaned.isBlank()) {
                normalized.add(cleaned);
            }
        }
        return normalized;
    }

    private String defaultIfBlank(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }
}
