package com.example.ChatBot.dto.chat;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.io.Serializable;
import java.util.List;

/**
 * REST API request DTO for POST /api/groups (create group).
 * Replaces the raw Map&lt;String, Object&gt; body.
 */
@Data
public class CreateGroupRequest implements Serializable {

    @NotBlank(message = "Admin mobile is required")
    private String adminMobile;

    @NotBlank(message = "Group name is required")
    @Size(min = 1, max = 100, message = "Group name must be between 1 and 100 characters")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    private List<String> members;
}
