package com.bookmarks.auth;

import java.util.List;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

public class AudienceValidator implements OAuth2TokenValidator<Jwt> {

    private final String clientId;

    public AudienceValidator(String clientId) {
        this.clientId = clientId;
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt token) {
        if (clientId == null || clientId.isBlank()) {
            return OAuth2TokenValidatorResult.success();
        }
        List<String> audiences = token.getAudience();
        if (audiences != null && audiences.contains(clientId)) {
            return OAuth2TokenValidatorResult.success();
        }
        OAuth2Error error = new OAuth2Error("invalid_token", "Invalid audience", null);
        return OAuth2TokenValidatorResult.failure(error);
    }
}
