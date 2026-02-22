package com.example.ChatBot.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class GoogleOAuthService {

    private final GoogleIdTokenVerifier verifier;

    public GoogleOAuthService(@Value("${google.client-id}") String clientId) {
        this.verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    /**
     * Verifies a Google ID token and returns user info.
     * @param idTokenString the raw ID token from the frontend
     * @return GoogleUserInfo with email, name, pictureUrl; or null if invalid
     */
    public GoogleUserInfo verify(String idTokenString) {
        try {
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                return null;
            }
            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            if (email == null || email.isBlank()) {
                return null;
            }

            return new GoogleUserInfo(
                    email,
                    name != null ? name : email.split("@")[0],
                    pictureUrl
            );
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Simple record-like class holding verified Google user info.
     */
    public static class GoogleUserInfo {
        private final String email;
        private final String name;
        private final String pictureUrl;

        public GoogleUserInfo(String email, String name, String pictureUrl) {
            this.email = email;
            this.name = name;
            this.pictureUrl = pictureUrl;
        }

        public String getEmail() { return email; }
        public String getName() { return name; }
        public String getPictureUrl() { return pictureUrl; }
    }
}
