package com.bookmarks.user;

import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserProfileService profileService;

    public UserController(UserProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/health")
    public String health() {
        return "user-service:ok";
    }

    @GetMapping("/me")
    public UserProfileResponse me(@AuthenticationPrincipal Jwt jwt) {
        return profileService.getOrCreate(jwt);
    }

    @PutMapping("/me")
    public UserProfileResponse updateMe(@AuthenticationPrincipal Jwt jwt,
                                        @Valid @RequestBody UserProfileUpdateRequest request) {
        return profileService.update(jwt, request);
    }

    @GetMapping("/{id}")
    public UserProfileResponse getPublic(@PathVariable UUID id) {
        return profileService.getPublic(id);
    }
}
