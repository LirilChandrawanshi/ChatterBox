package com.example.ChatBot.dto.auth;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import java.io.Serializable;
@Data
public class LoginDto implements Serializable {
    @NotBlank(message = "Mobile is required")
    private String mobile;
    @NotBlank (message = "Password is required")
    private String password;
}
