package com.example.ChatBot.dto.auth;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;
import java.io.Serializable;

@Data
@Getter
@Setter

public class SignupRequestDto implements Serializable {
    @NotBlank(message = "Mobile is required")
    @Pattern(regexp = "^[0-9]{10,15}$", message = "Invalid mobile number")
    private String mobile;

    @NotBlank(message = "Display name is required")
    @Size(min = 2, max = 50)
    private String displayName;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
}
