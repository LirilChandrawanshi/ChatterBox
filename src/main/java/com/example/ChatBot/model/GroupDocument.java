package com.example.ChatBot.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.HashSet;
import java.util.Set;

@Document(collection = "groups")
public class GroupDocument {

    @Id
    private String id;

    private String name;
    private String description;
    private String admin; // Mobile number of the creator/admin
    private Set<String> members = new HashSet<>();
    private String profilePicture;
    private long createdAt;

    // Last message info for preview in lists
    private long lastMessageAt;
    private String lastMessagePreview;
    private String lastMessageSenderName; // e.g. "Alice"

    public GroupDocument() {
    }

    public GroupDocument(String name, String admin, Set<String> members) {
        this.name = name;
        this.admin = admin;
        this.members = members;
        // Ensure admin is in the members list
        if (this.members == null) {
            this.members = new HashSet<>();
        }
        this.members.add(admin);
        this.createdAt = System.currentTimeMillis();
        this.lastMessageAt = this.createdAt;
    }

    // Getters and Setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAdmin() {
        return admin;
    }

    public void setAdmin(String admin) {
        this.admin = admin;
    }

    public Set<String> getMembers() {
        return members;
    }

    public void setMembers(Set<String> members) {
        this.members = members;
    }

    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }

    public long getLastMessageAt() {
        return lastMessageAt;
    }

    public void setLastMessageAt(long lastMessageAt) {
        this.lastMessageAt = lastMessageAt;
    }

    public String getLastMessagePreview() {
        return lastMessagePreview;
    }

    public void setLastMessagePreview(String lastMessagePreview) {
        this.lastMessagePreview = lastMessagePreview;
    }

    public String getLastMessageSenderName() {
        return lastMessageSenderName;
    }

    public void setLastMessageSenderName(String lastMessageSenderName) {
        this.lastMessageSenderName = lastMessageSenderName;
    }
}
