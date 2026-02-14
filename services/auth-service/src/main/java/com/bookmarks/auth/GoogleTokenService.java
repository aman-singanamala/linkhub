package com.bookmarks.auth;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Service;

@Service
public class GoogleTokenService {

    private final JwtDecoder googleJwtDecoder;

    public GoogleTokenService(JwtDecoder googleJwtDecoder) {
        this.googleJwtDecoder = googleJwtDecoder;
    }

    public GoogleTokenPayload verify(String idToken) {
        Jwt jwt = googleJwtDecoder.decode(idToken);

        Boolean emailVerified = jwt.getClaim("email_verified");
        if (emailVerified != null && !emailVerified) {
            throw new BadCredentialsException("Google account email is not verified");
        }

        String email = jwt.getClaimAsString("email");
        String name = jwt.getClaimAsString("name");
        String picture = jwt.getClaimAsString("picture");
        if (email == null || email.isBlank()) {
            throw new BadCredentialsException("Google token missing email");
        }
        if (name == null || name.isBlank()) {
            name = "Google User";
        }

        return new GoogleTokenPayload(jwt.getSubject(), email, name, picture);
    }
}
