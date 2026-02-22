package com.example.ChatBot.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * User identified by mobile number (WhatsApp-style).
 * Password is stored hashed; never serialized to JSON.
 */
@Document(collection = "users")
public class UserDocument {

    @Id
    private String id;

    @Indexed(unique = true)
    private String mobile;

    private String displayName;
    @JsonIgnore
    private String hashedPassword;
    private String profilePicture; // Base64 encoded profile picture
    private String bio; // User bio, max 150 chars
    private long createdAt;

    public UserDocument() {
    }

    public UserDocument(String mobile, String displayName) {
        this.mobile = normalizeMobile(mobile);
        this.displayName = displayName != null && !displayName.isBlank() ? displayName.trim() : this.mobile;
        this.createdAt = System.currentTimeMillis();
    }

    public static String normalizeMobile(String mobile) {
        if (mobile == null)
            return null;
        // Preserve OAuth identifiers (e.g. "google_user@email.com")
        if (mobile.startsWith("google_")) {
            return mobile.trim();
        }
        return mobile.replaceAll("[^0-9]", "").trim();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = normalizeMobile(mobile);
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }

    @JsonIgnore
    public String getHashedPassword() {
        return hashedPassword;
    }

    public void setHashedPassword(String hashedPassword) {
        this.hashedPassword = hashedPassword;
    }

    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio != null && bio.length() > 150 ? bio.substring(0, 150) : bio;
    }
}
