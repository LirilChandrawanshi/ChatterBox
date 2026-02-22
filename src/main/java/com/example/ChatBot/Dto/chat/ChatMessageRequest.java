package com.example.ChatBot.dto.chat;

import com.example.ChatBot.model.MessageType;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.io.Serializable;

/**
 * WebSocket request DTO for sending a chat text message.
 * Used with @MessageMapping("/chat.sendMessage")
 */
@Data
public class ChatMessageRequest implements Serializable {

    @NotNull(message = "Message type is required")
    private MessageType type;

    @Size(max = 2000, message = "Content must not exceed 2000 characters")
    private String content;

    @NotBlank(message = "Sender is required")
    @Size(min = 1, max = 50, message = "Sender must be between 1 and 50 characters")
    private String sender;

    /** Conversation id for 1:1 or group chats. */
    private String conversationId;

    /** For reply-to-message feature */
    private String replyToId;
    private String replyToContent;
    private String replyToSender;
}
