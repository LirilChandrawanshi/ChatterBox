package com.example.ChatBot.dto.chat;

import com.example.ChatBot.model.MessageType;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.io.Serializable;

/**
 * WebSocket request DTO for sending a file message.
 * Used with @MessageMapping("/chat.sendFile")
 */
@Data
public class FileMessageRequest implements Serializable {

    @NotNull(message = "Message type is required")
    private MessageType type;

    @NotBlank(message = "Sender is required")
    @Size(min = 1, max = 50, message = "Sender must be between 1 and 50 characters")
    private String sender;

    @Size(max = 10485760, message = "File content must not exceed 10MB (base64 encoded)")
    private String fileContent;

    @Size(max = 100, message = "File type must not exceed 100 characters")
    private String fileType;

    /** Conversation id for 1:1 or group chats. */
    private String conversationId;
}
