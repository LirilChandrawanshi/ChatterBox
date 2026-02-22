package com.example.ChatBot.dto.user;

import com.example.ChatBot.model.UserDocument;
import lombok.Data;

import java.io.Serializable;

/**
 * Response DTO for any user's public profile.
 * Used by GET /api/users/profile/{mobile}.
 * Exposes only safe, public-facing fields.
 */
@Data
public class UserProfileResponse implements Serializable {

    private String mobile;
    private String displayName;
    private String bio;
    private String profilePicture;

    public static UserProfileResponse from(UserDocument user) {
        UserProfileResponse dto = new UserProfileResponse();
        dto.setMobile(user.getMobile());
        dto.setDisplayName(user.getDisplayName() != null ? user.getDisplayName() : user.getMobile());
        dto.setBio(user.getBio() != null ? user.getBio() : "");
        dto.setProfilePicture(user.getProfilePicture() != null ? user.getProfilePicture() : "");
        return dto;
    }
}
