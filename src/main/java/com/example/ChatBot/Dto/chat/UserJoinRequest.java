package com.example.ChatBot.dto.chat;

import com.example.ChatBot.model.MessageType;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.io.Serializable;

/**
 * WebSocket request DTO for user join events.
 * Used with @MessageMapping("/chat.addUser")
 */
@Data
public class UserJoinRequest implements Serializable {

    @NotNull(message = "Message type is required")
    private MessageType type;

    @NotBlank(message = "Sender is required")
    @Size(min = 1, max = 50)
    private String sender;
}
