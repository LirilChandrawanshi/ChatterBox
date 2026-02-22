package com.example.ChatBot.dto.community;

import com.example.ChatBot.model.CommunityPostDocument;
import lombok.Data;

import java.io.Serializable;

/**
 * Response DTO for a single comment on a community post.
 */
@Data
public class CommentResponse implements Serializable {

    private String authorMobile;
    private String authorName;
    private String content;
    private long createdAt;

    public static CommentResponse from(CommunityPostDocument.Comment comment) {
        CommentResponse dto = new CommentResponse();
        dto.setAuthorMobile(comment.getAuthorMobile());
        dto.setAuthorName(comment.getAuthorName());
        dto.setContent(comment.getContent());
        dto.setCreatedAt(comment.getCreatedAt());
        return dto;
    }
}
