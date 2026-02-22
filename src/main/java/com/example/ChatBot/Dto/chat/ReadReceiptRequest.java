package com.example.ChatBot.dto.chat;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.io.Serializable;

/**
 * WebSocket request DTO for read receipts.
 * Used with @MessageMapping("/chat.read")
 */
@Data
public class ReadReceiptRequest implements Serializable {

    @NotBlank(message = "Sender is required")
    @Size(min = 1, max = 50)
    private String sender;

    @NotBlank(message = "Conversation ID is required for read receipts")
    private String conversationId;
}
