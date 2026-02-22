package com.example.ChatBot.dto.chat;

import com.example.ChatBot.model.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Response DTO for chat messages — used in both REST responses and WebSocket
 * outbound.
 * This is the canonical shape that the frontend always receives.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse implements Serializable {

    /** Server-assigned message id (only for persisted CHAT/FILE messages). */
    private String id;

    private MessageType type;
    private String content;
    private String sender;
    private String conversationId;
    private long timestamp;

    /** File-specific fields (only present for FILE type). */
    private String fileContent;
    private String fileType;

    /** Reply-to fields (only present when replying to a message). */
    private String replyToId;
    private String replyToContent;
    private String replyToSender;
}
