package com.example.ChatBot.dto.auth;

import com.example.ChatBot.model.UserDocument;
import lombok.Data;

import java.io.Serializable;

@Data
public class AuthResponseDto implements Serializable {
    private UserDocument user;
    private String token;
}
