package com.example.ChatBot.dto.chat;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.io.Serializable;

/**
 * REST API request DTO for POST /api/conversations (get-or-create).
 * Replaces the raw Map&lt;String, String&gt; body.
 */
@Data
public class CreateConversationRequest implements Serializable {

    @NotBlank(message = "Other user's mobile number is required")
    private String otherUserMobile;
}
