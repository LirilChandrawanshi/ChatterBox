package com.example.ChatBot.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a public community post visible to all users.
 */
@Document(collection = "community_posts")
public class CommunityPostDocument {

    @Id
    private String id;

    private String authorMobile;
    private String authorName;
    private String content;
    private String imageBase64;
    private String imageType;
    private long createdAt;
    private List<String> likes = new ArrayList<>(); // List of mobiles who liked
    private List<Comment> comments = new ArrayList<>(); // Embedded comments

    public CommunityPostDocument() {
    }

    public CommunityPostDocument(String authorMobile, String authorName, String content) {
        this.authorMobile = authorMobile;
        this.authorName = authorName;
        this.content = content;
        this.createdAt = System.currentTimeMillis();
    }

    // Embedded Comment class
    public static class Comment {
        private String authorMobile;
        private String authorName;
        private String content;
        private long createdAt;

        public Comment() {
        }

        public Comment(String authorMobile, String authorName, String content) {
            this.authorMobile = authorMobile;
            this.authorName = authorName;
            this.content = content;
            this.createdAt = System.currentTimeMillis();
        }

        public String getAuthorMobile() {
            return authorMobile;
        }

        public void setAuthorMobile(String authorMobile) {
            this.authorMobile = authorMobile;
        }

        public String getAuthorName() {
            return authorName;
        }

        public void setAuthorName(String authorName) {
            this.authorName = authorName;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public long getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(long createdAt) {
            this.createdAt = createdAt;
        }
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getAuthorMobile() {
        return authorMobile;
    }

    public void setAuthorMobile(String authorMobile) {
        this.authorMobile = authorMobile;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
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

    public List<String> getLikes() {
        return likes;
    }

    public void setLikes(List<String> likes) {
        this.likes = likes;
    }

    public List<Comment> getComments() {
        return comments;
    }

    public void setComments(List<Comment> comments) {
        this.comments = comments;
    }

    public void toggleLike(String mobile) {
        if (this.likes.contains(mobile)) {
            this.likes.remove(mobile);
        } else {
            this.likes.add(mobile);
        }
    }

    public void addComment(Comment comment) {
        this.comments.add(comment);
    }
}
