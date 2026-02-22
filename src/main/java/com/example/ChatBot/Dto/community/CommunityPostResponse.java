package com.example.ChatBot.dto.community;

import com.example.ChatBot.model.CommunityPostDocument;
import lombok.Data;

import java.io.Serializable;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Response DTO for a community post.
 * Decouples the API response shape from the MongoDB entity.
 */
@Data
public class CommunityPostResponse implements Serializable {

    private String id;
    private String authorMobile;
    private String authorName;
    private String content;
    private String imageBase64;
    private String imageType;
    private long createdAt;
    private List<String> likes;
    private List<CommentResponse> comments;

    /**
     * Factory method to convert entity → response DTO.
     */
    public static CommunityPostResponse from(CommunityPostDocument post) {
        CommunityPostResponse dto = new CommunityPostResponse();
        dto.setId(post.getId());
        dto.setAuthorMobile(post.getAuthorMobile());
        dto.setAuthorName(post.getAuthorName());
        dto.setContent(post.getContent());
        dto.setImageBase64(post.getImageBase64());
        dto.setImageType(post.getImageType());
        dto.setCreatedAt(post.getCreatedAt());
        dto.setLikes(post.getLikes());
        dto.setComments(
                post.getComments() != null
                        ? post.getComments().stream()
                                .map(CommentResponse::from)
                                .collect(Collectors.toList())
                        : List.of());
        return dto;
    }
}
