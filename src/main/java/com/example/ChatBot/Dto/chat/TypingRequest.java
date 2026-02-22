package com.example.ChatBot.dto.chat;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.io.Serializable;

/**
 * WebSocket request DTO for typing indicators.
 * Used with @MessageMapping("/chat.typing")
 */
@Data
public class TypingRequest implements Serializable {

    @NotBlank(message = "Sender is required")
    @Size(min = 1, max = 50)
    private String sender;

    /** Conversation id — if null, falls back to broadcast. */
    private String conversationId;
}
