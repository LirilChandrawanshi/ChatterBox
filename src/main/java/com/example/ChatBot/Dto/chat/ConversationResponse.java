package com.example.ChatBot.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Response DTO for conversation list items.
 * Replaces the raw Map&lt;String, Object&gt; returned by
 * ConversationController.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse implements Serializable {

    private String id;
    private String participant1;
    private String participant2;
    private long lastMessageAt;
    private String lastMessagePreview;
    private String otherParticipantMobile;
    private String otherParticipantName;

    /** Timestamp when the other participant last read (for blue tick display). */
    private Long otherLastReadAt;
}
