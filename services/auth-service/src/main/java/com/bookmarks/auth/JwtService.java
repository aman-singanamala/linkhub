package com.bookmarks.auth;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;

import org.springframework.stereotype.Service;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

@Service
public class JwtService {

    private final AppProperties properties;
    private final byte[] secret;

    public JwtService(AppProperties properties) {
        this.properties = properties;
        String rawSecret = properties.getJwt().getSecret();
        if (rawSecret == null || rawSecret.isBlank()) {
            throw new IllegalArgumentException("app.jwt.secret must be configured");
        }
        this.secret = rawSecret.getBytes(StandardCharsets.UTF_8);
        if (this.secret.length < 32) {
            throw new IllegalArgumentException("app.jwt.secret must be at least 32 characters");
        }
    }

    public String generate(AuthUser user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(properties.getJwt().getExpirationSeconds());

        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .issuer(properties.getJwt().getIssuer())
                .subject(user.getId().toString())
                .issueTime(Date.from(now))
                .expirationTime(Date.from(expiresAt))
                .claim("email", user.getEmail())
                .claim("name", user.getName())
                .claim("username", user.getUsername())
                .claim("avatarUrl", user.getAvatarUrl())
                .claim("roles", List.of(user.getRole()))
                .build();

        SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        try {
            signedJWT.sign(new MACSigner(secret));
        } catch (JOSEException e) {
            throw new IllegalStateException("Failed to sign JWT", e);
        }
        return signedJWT.serialize();
    }
}
