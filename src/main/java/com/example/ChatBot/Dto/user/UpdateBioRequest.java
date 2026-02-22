package com.example.ChatBot.dto.user;

import lombok.Data;

import javax.validation.constraints.Size;
import java.io.Serializable;

/**
 * Request DTO for updating a user's bio.
 */
@Data
public class UpdateBioRequest implements Serializable {

    @Size(max = 150, message = "Bio must not exceed 150 characters")
    private String bio;
}
