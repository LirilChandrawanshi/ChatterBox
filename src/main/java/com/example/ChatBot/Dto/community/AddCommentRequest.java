package com.example.ChatBot.dto.community;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.io.Serializable;

/**
 * Request DTO for adding a comment to a community post.
 */
@Data
public class AddCommentRequest implements Serializable {

    @NotBlank(message = "Comment content is required")
    @Size(max = 2000, message = "Comment must not exceed 2000 characters")
    private String content;
}
