package com.example.ChatBot.controller;

import com.example.ChatBot.Dto.auth.AuthResponseDto;
import com.example.ChatBot.Dto.auth.LoginDto;
import com.example.ChatBot.Dto.auth.SignupRequestDto;
import com.example.ChatBot.model.UserDocument;
import com.example.ChatBot.service.JwtService;
import com.example.ChatBot.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;

    public AuthController(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    /**
     * POST /api/auth/signup
     * Body: { "mobile": "9876543210", "displayName": "John", "password": "secret123" }
     */
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequestDto signupRequestDto) {

        try {
            UserDocument user = userService.signup(signupRequestDto.getMobile(), signupRequestDto.getDisplayName(), signupRequestDto.getPassword());

            String token = jwtService.generate(user.getMobile());

            AuthResponseDto authResponseDto = new AuthResponseDto();
            authResponseDto.setToken(token);
            authResponseDto.setUser(user);
            return ResponseEntity.ok(authResponseDto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/auth/login
     * Body: { "mobile": "9876543210", "password": "secret123" }
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginDto loginDto ) {
        UserDocument user = userService.login(loginDto.getMobile(), loginDto.getPassword());
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid mobile or password"));
        }
        String token = jwtService.generate(user.getMobile());
        AuthResponseDto authResponseDto = new AuthResponseDto();
        authResponseDto.setToken(token);
        authResponseDto.setUser(user);
        return ResponseEntity.ok(authResponseDto);
    }


}
