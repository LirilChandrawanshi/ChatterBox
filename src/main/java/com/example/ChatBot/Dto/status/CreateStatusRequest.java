package com.example.ChatBot.dto.status;

import lombok.Data;

import javax.validation.constraints.Size;
import java.io.Serializable;

/**
 * Request DTO for creating a new status (story).
 * At least one of content or imageBase64 must be provided.
 */
@Data
public class CreateStatusRequest implements Serializable {

    @Size(max = 5000, message = "Content must not exceed 5000 characters")
    private String content;

    private String imageBase64;

    @Size(max = 50, message = "Image type must not exceed 50 characters")
    private String imageType;
}
