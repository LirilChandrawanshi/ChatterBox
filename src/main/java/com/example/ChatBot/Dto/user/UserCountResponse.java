package com.example.ChatBot.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.io.Serializable;

/**
 * Response DTO for total user count.
 */
@Data
@AllArgsConstructor
public class UserCountResponse implements Serializable {

    private long count;
}
