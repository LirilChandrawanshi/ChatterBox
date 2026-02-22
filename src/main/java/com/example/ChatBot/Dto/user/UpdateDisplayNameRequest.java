package com.example.ChatBot.dto.user;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.io.Serializable;

/**
 * Request DTO for updating a user's display name.
 */
@Data
public class UpdateDisplayNameRequest implements Serializable {

    @NotBlank(message = "Display name is required")
    @Size(min = 1, max = 50, message = "Display name must be between 1 and 50 characters")
    private String displayName;
}
