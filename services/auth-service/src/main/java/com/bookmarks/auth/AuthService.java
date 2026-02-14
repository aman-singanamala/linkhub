package com.bookmarks.auth;

import java.util.Locale;
import java.util.UUID;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final String PROVIDER_GOOGLE = "google";

    private final AuthUserRepository authUserRepository;
    private final GoogleTokenService googleTokenService;
    private final JwtService jwtService;
    private final AppProperties properties;

    public AuthService(AuthUserRepository authUserRepository,
                       GoogleTokenService googleTokenService,
                       JwtService jwtService,
                       AppProperties properties) {
        this.authUserRepository = authUserRepository;
        this.googleTokenService = googleTokenService;
        this.jwtService = jwtService;
        this.properties = properties;
    }

    @Transactional
    public AuthResponse authenticateWithGoogle(GoogleAuthRequest request) {
        GoogleTokenPayload payload = googleTokenService.verify(request.idToken());

        AuthUser user = authUserRepository
                .findByProviderAndProviderId(PROVIDER_GOOGLE, payload.subject())
                .or(() -> authUserRepository.findByEmail(payload.email()))
                .orElseGet(() -> createNewUser(payload, request.username()));

        boolean changed = false;
        if (!PROVIDER_GOOGLE.equals(user.getProvider())) {
            user.setProvider(PROVIDER_GOOGLE);
            changed = true;
        }
        if (user.getProviderId() == null || user.getProviderId().isBlank()) {
            user.setProviderId(payload.subject());
            changed = true;
        }
        if (payload.name() != null && !payload.name().equals(user.getName())) {
            user.setName(payload.name());
            changed = true;
        }
        if (payload.email() != null && !payload.email().equals(user.getEmail())) {
            user.setEmail(payload.email());
            changed = true;
        }
        if (payload.picture() != null && !payload.picture().equals(user.getAvatarUrl())) {
            user.setAvatarUrl(payload.picture());
            changed = true;
        }
        if (user.getRole() == null || user.getRole().isBlank()) {
            user.setRole("USER");
            changed = true;
        }

        String requestedUsername = request.username();
        if (requestedUsername != null && !requestedUsername.isBlank()
                && !requestedUsername.equals(user.getUsername())) {
            user.setUsername(resolveUsername(requestedUsername, user.getId()));
            changed = true;
        }

        if (changed) {
            user = authUserRepository.save(user);
        }

        String token = jwtService.generate(user);
        return new AuthResponse(
                token,
                "Bearer",
                properties.getJwt().getExpirationSeconds(),
                new UserDto(user.getId(), user.getEmail(), user.getName(), user.getUsername(), user.getAvatarUrl())
        );
    }

    private AuthUser createNewUser(GoogleTokenPayload payload, String requestedUsername) {
        if (payload.email() == null || payload.email().isBlank()) {
            throw new BadCredentialsException("Google token missing email");
        }

        AuthUser user = new AuthUser();
        user.setProvider(PROVIDER_GOOGLE);
        user.setProviderId(payload.subject());
        user.setEmail(payload.email());
        user.setName(payload.name() != null ? payload.name() : "Google User");
        user.setUsername(resolveUsername(requestedUsername, null, payload.email()));
        user.setAvatarUrl(payload.picture());
        user.setRole("USER");
        return authUserRepository.save(user);
    }

    private String resolveUsername(String requested, UUID userId) {
        String normalized = normalizeUsername(requested);
        return ensureUniqueUsername(normalized, userId);
    }

    private String resolveUsername(String requested, UUID userId, String email) {
        String base = normalizeUsername(requested);
        if (base.isBlank() && email != null) {
            int at = email.indexOf('@');
            base = at > 0 ? email.substring(0, at) : email;
            base = normalizeUsername(base);
        }
        if (base.isBlank()) {
            base = "user";
        }
        return ensureUniqueUsername(base, userId);
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

    private String ensureUniqueUsername(String base, UUID userId) {
        String candidate = base.isBlank() ? "user" : base;
        int attempt = 0;
        while (isUsernameTaken(candidate, userId)) {
            attempt++;
            candidate = base + attempt;
            if (candidate.length() > 30) {
                candidate = candidate.substring(0, 30);
            }
            if (attempt > 200) {
                candidate = base + "_" + UUID.randomUUID().toString().substring(0, 6);
                if (!isUsernameTaken(candidate, userId)) {
                    break;
                }
            }
        }
        return candidate;
    }

    private boolean isUsernameTaken(String username, UUID userId) {
        if (userId == null) {
            return authUserRepository.existsByUsername(username);
        }
        return authUserRepository.existsByUsernameAndIdNot(username, userId);
    }
}
