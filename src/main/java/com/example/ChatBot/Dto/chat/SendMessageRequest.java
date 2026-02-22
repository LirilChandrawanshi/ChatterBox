package com.example.ChatBot.dto.chat;

import lombok.Data;

import javax.validation.constraints.Size;
import java.io.Serializable;

/**
 * REST API request DTO for sending a message via POST
 * /api/conversations/:id/messages.
 * Replaces the raw Map&lt;String, Object&gt; body.
 */
@Data
public class SendMessageRequest implements Serializable {

    @Size(max = 2000, message = "Content must not exceed 2000 characters")
    private String content;

    @Size(max = 10485760, message = "File content must not exceed 10MB")
    private String fileContent;

    @Size(max = 100, message = "File type must not exceed 100 characters")
    private String fileType;

    /** For reply-to-message feature */
    private String replyToId;
    private String replyToContent;
    private String replyToSender;
}
