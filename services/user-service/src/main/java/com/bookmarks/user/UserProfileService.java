package com.bookmarks.user;

import java.util.Locale;
import java.util.UUID;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class UserProfileService {

    private final UserProfileRepository repository;

    public UserProfileService(UserProfileRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public UserProfileResponse getOrCreate(Jwt jwt) {
        UUID id = parseUserId(jwt);
        return repository.findById(id)
                .map(this::toResponse)
                .orElseGet(() -> createFromJwt(id, jwt));
    }

    @Transactional
    public UserProfileResponse update(Jwt jwt, UserProfileUpdateRequest request) {
        UUID id = parseUserId(jwt);
        UserProfileEntity profile = repository.findById(id)
                .orElseGet(() -> createEntityFromJwt(id, jwt));

        boolean changed = false;
        if (request.name() != null && !request.name().isBlank()) {
            profile.setName(request.name().trim());
            changed = true;
        }
        if (request.username() != null && !request.username().isBlank()) {
            String newUsername = ensureUniqueUsername(normalizeUsername(request.username()), id);
            profile.setUsername(newUsername);
            changed = true;
        }
        if (request.bio() != null) {
            profile.setBio(request.bio().trim());
            changed = true;
        }
        if (request.avatarUrl() != null) {
            profile.setAvatarUrl(request.avatarUrl().trim());
            changed = true;
        }

        if (changed) {
            profile = repository.save(profile);
        }
        return toResponse(profile);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getPublic(UUID id) {
        return repository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private UserProfileResponse createFromJwt(UUID id, Jwt jwt) {
        UserProfileEntity entity = createEntityFromJwt(id, jwt);
        entity = repository.save(entity);
        return toResponse(entity);
    }

    private UserProfileEntity createEntityFromJwt(UUID id, Jwt jwt) {
        UserProfileEntity entity = new UserProfileEntity();
        entity.setId(id);
        entity.setEmail(safe(jwt.getClaimAsString("email")));
        entity.setName(defaultIfBlank(jwt.getClaimAsString("name"), "User"));
        String claimUsername = jwt.getClaimAsString("username");
        entity.setUsername(ensureUniqueUsername(resolveUsername(claimUsername, entity.getEmail()), id));
        entity.setAvatarUrl(jwt.getClaimAsString("avatarUrl"));
        return entity;
    }

    private UUID parseUserId(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getSubject());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token subject");
        }
    }

    private String resolveUsername(String preferred, String email) {
        String base = normalizeUsername(preferred);
        if (base.isBlank() && email != null) {
            int at = email.indexOf('@');
            base = at > 0 ? email.substring(0, at) : email;
            base = normalizeUsername(base);
        }
        if (base.isBlank()) {
            base = "user";
        }
        return base;
    }

    private String normalizeUsername(String raw) {
        if (raw == null) {
            return "";
        }
        String normalized = raw.trim().toLowerCase(Locale.ROOT);
        normalized = normalized.replaceAll("[^a-z0-9]+", "_");
        normalized = normalized.replaceAll("^_+|_+$", "");
        if (normalized.length() > 30) {
            normalized = normalized.substring(0, 30);
        }
        return normalized;
    }

    private String ensureUniqueUsername(String base, UUID id) {
        String candidate = base.isBlank() ? "user" : base;
        int attempt = 0;
        while (isUsernameTaken(candidate, id)) {
            attempt++;
            candidate = base + attempt;
            if (candidate.length() > 30) {
                candidate = candidate.substring(0, 30);
            }
            if (attempt > 200) {
                candidate = base + "_" + UUID.randomUUID().toString().substring(0, 6);
                if (!isUsernameTaken(candidate, id)) {
                    break;
                }
            }
        }
        return candidate;
    }

    private boolean isUsernameTaken(String username, UUID id) {
        return repository.existsByUsernameAndIdNot(username, id);
    }

    private UserProfileResponse toResponse(UserProfileEntity entity) {
        return new UserProfileResponse(
                entity.getId(),
                entity.getEmail(),
                entity.getName(),
                entity.getUsername(),
                entity.getBio(),
                entity.getAvatarUrl(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private String safe(String value) {
        if (value == null || value.isBlank()) {
            return "unknown@example.com";
        }
        return value;
    }

    private String defaultIfBlank(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }
}
