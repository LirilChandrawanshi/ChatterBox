package com.example.ChatBot.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.io.Serializable;

/**
 * Response DTO for a user's profile picture.
 */
@Data
@AllArgsConstructor
public class ProfilePictureResponse implements Serializable {

    private String picture;
}
