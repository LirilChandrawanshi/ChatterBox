package com.example.ChatBot.dto.status;

import com.example.ChatBot.model.StatusDocument;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * Response DTO for a single status item.
 * Decouples the API response from the MongoDB entity.
 */
@Data
public class StatusResponse implements Serializable {

    private String id;
    private String userMobile;
    private String userName;
    private String content;
    private String imageBase64;
    private String imageType;
    private long createdAt;
    private long expiresAt;
    private List<String> viewedBy;

    public static StatusResponse from(StatusDocument status) {
        StatusResponse dto = new StatusResponse();
        dto.setId(status.getId());
        dto.setUserMobile(status.getUserMobile());
        dto.setUserName(status.getUserName());
        dto.setContent(status.getContent());
        dto.setImageBase64(status.getImageBase64());
        dto.setImageType(status.getImageType());
        dto.setCreatedAt(status.getCreatedAt());
        dto.setExpiresAt(status.getExpiresAt());
        dto.setViewedBy(status.getViewedBy());
        return dto;
    }
}
