package com.example.ChatBot.dto.user;

import com.example.ChatBot.model.UserDocument;
import lombok.Data;

import java.io.Serializable;

/**
 * Response DTO for the current user's own profile.
 * Used by GET /api/users/me — excludes sensitive fields like hashedPassword.
 */
@Data
public class UserResponse implements Serializable {

    private String id;
    private String mobile;
    private String displayName;
    private long createdAt;
    private String bio;
    private String profilePicture;

    public static UserResponse from(UserDocument user) {
        UserResponse dto = new UserResponse();
        dto.setId(user.getId());
        dto.setMobile(user.getMobile());
        dto.setDisplayName(user.getDisplayName());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setBio(user.getBio());
        dto.setProfilePicture(user.getProfilePicture());
        return dto;
    }
}
