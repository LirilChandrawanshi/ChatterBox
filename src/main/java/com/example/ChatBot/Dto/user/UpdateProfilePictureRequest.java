package com.example.ChatBot.dto.user;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.io.Serializable;

/**
 * Request DTO for updating a user's profile picture.
 */
@Data
public class UpdateProfilePictureRequest implements Serializable {

    @NotBlank(message = "Picture data is required")
    private String picture;
}
