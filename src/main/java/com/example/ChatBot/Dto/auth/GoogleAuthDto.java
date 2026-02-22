package com.example.ChatBot.dto.auth;

import javax.validation.constraints.NotBlank;

public class GoogleAuthDto {

    @NotBlank(message = "Google ID token is required")
    private String idToken;

    public GoogleAuthDto() {
    }

    public String getIdToken() {
        return idToken;
    }

    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }
}
