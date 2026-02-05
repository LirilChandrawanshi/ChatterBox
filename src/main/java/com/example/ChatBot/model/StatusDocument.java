package com.example.ChatBot.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a user's status update (story) that expires after 24 hours.
 */
@Document(collection = "statuses")
public class StatusDocument {

    @Id
    private String id;

    private String userMobile;
    private String userName;
    private String content; // Text content
    private String imageBase64; // Optional image
    private String imageType; // e.g., "image/jpeg"
    private long createdAt;
    private long expiresAt; // createdAt + 24 hours
    private List<String> viewedBy = new ArrayList<>(); // List of mobiles who viewed

    public StatusDocument() {
    }

    public StatusDocument(String userMobile, String userName, String content) {
        this.userMobile = userMobile;
        this.userName = userName;
        this.content = content;
        this.createdAt = System.currentTimeMillis();
        this.expiresAt = this.createdAt + (24 * 60 * 60 * 1000); // 24 hours
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserMobile() {
        return userMobile;
    }

    public void setUserMobile(String userMobile) {
        this.userMobile = userMobile;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getImageBase64() {
        return imageBase64;
    }

    public void setImageBase64(String imageBase64) {
        this.imageBase64 = imageBase64;
    }

    public String getImageType() {
        return imageType;
    }

    public void setImageType(String imageType) {
        this.imageType = imageType;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }

    public long getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(long expiresAt) {
        this.expiresAt = expiresAt;
    }

    public List<String> getViewedBy() {
        return viewedBy;
    }

    public void setViewedBy(List<String> viewedBy) {
        this.viewedBy = viewedBy;
    }

    public void addViewer(String mobile) {
        if (!this.viewedBy.contains(mobile)) {
            this.viewedBy.add(mobile);
        }
    }
}
