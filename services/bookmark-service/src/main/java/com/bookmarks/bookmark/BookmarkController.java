package com.bookmarks.bookmark;

import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/bookmarks")
public class BookmarkController {

    private final BookmarkService bookmarkService;

    public BookmarkController(BookmarkService bookmarkService) {
        this.bookmarkService = bookmarkService;
    }

    @GetMapping("/health")
    public String health() {
        return "bookmark-service:ok";
    }

    @GetMapping
    public BookmarkListResponse listPublic(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String tag) {
        return bookmarkService.listPublic(page, size, tag);
    }

    @GetMapping("/me")
    public BookmarkListResponse listMine(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal Jwt jwt) {
        return bookmarkService.listForOwner(jwt, page, size);
    }

    @GetMapping("/saved")
    public BookmarkListResponse listSaved(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal Jwt jwt) {
        return bookmarkService.listSaved(jwt, page, size);
    }

    @GetMapping("/users/{username}")
    public BookmarkListResponse listByUsername(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return bookmarkService.listForUsername(username, page, size);
    }

    @GetMapping("/{id}")
    public BookmarkResponse getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt,
            Authentication authentication) {
        return bookmarkService.getById(id, jwt, authentication);
    }

    @PostMapping
    public BookmarkResponse create(
            @Valid @RequestBody BookmarkCreateRequest request,
            @AuthenticationPrincipal Jwt jwt,
            Authentication authentication) {
        return bookmarkService.create(request, jwt, authentication);
    }

    @PutMapping("/{id}")
    public BookmarkResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody BookmarkUpdateRequest request,
            @AuthenticationPrincipal Jwt jwt,
            Authentication authentication) {
        return bookmarkService.update(id, request, jwt, authentication);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt,
            Authentication authentication) {
        bookmarkService.delete(id, jwt, authentication);
    }

    @PostMapping("/{id}/save")
    public BookmarkResponse recordSave(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt, Authentication authentication) {
        return bookmarkService.recordSave(id, jwt, authentication);
    }

    @DeleteMapping("/{id}/save")
    public BookmarkResponse removeSave(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt, Authentication authentication) {
        return bookmarkService.removeSave(id, jwt, authentication);
    }

    @PostMapping("/{id}/share")
    public BookmarkResponse recordShare(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt, Authentication authentication) {
        return bookmarkService.recordShare(id, jwt, authentication);
    }

    @DeleteMapping("/{id}/share")
    public BookmarkResponse removeShare(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt, Authentication authentication) {
        return bookmarkService.removeShare(id, jwt, authentication);
    }
}
