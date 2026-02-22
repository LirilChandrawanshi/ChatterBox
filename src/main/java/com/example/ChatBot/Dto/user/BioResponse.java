package com.example.ChatBot.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.io.Serializable;

/**
 * Response DTO for a user's bio.
 */
@Data
@AllArgsConstructor
public class BioResponse implements Serializable {

    private String bio;
}
