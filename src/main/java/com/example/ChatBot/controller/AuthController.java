package com.example.ChatBot.controller;

import com.example.ChatBot.model.UserDocument;
import com.example.ChatBot.service.JwtService;
import com.example.ChatBot.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<?> signup(@RequestBody Map<String, String> body) {
        String mobile = body != null ? body.get("mobile") : null;
        String displayName = body != null ? body.get("displayName") : null;
        String password = body != null ? body.get("password") : null;
        if (mobile == null || mobile.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mobile and password required"));
        }
        try {
            UserDocument user = userService.signup(mobile, displayName != null ? displayName : mobile, password);
            String token = jwtService.generate(user.getMobile());
            Map<String, Object> res = new HashMap<>();
            res.put("user", user);
            res.put("token", token);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/auth/login
     * Body: { "mobile": "9876543210", "password": "secret123" }
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String mobile = body != null ? body.get("mobile") : null;
        String password = body != null ? body.get("password") : null;
        if (mobile == null || mobile.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mobile and password required"));
        }
        UserDocument user = userService.login(mobile, password);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid mobile or password"));
        }
        String token = jwtService.generate(user.getMobile());
        Map<String, Object> res = new HashMap<>();
        res.put("user", user);
        res.put("token", token);
        return ResponseEntity.ok(res);
    }

    /**
     * POST /api/auth/register (legacy, no password)
     * Body: { "mobile": "+1234567890", "displayName": "John" }
     */
    @PostMapping("/register")
    public ResponseEntity<UserDocument> register(@RequestBody Map<String, String> body) {
        String mobile = body != null ? body.get("mobile") : null;
        String displayName = body != null ? body.get("displayName") : null;
        if (mobile == null || mobile.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        UserDocument user = userService.registerOrGet(mobile, displayName);
        return ResponseEntity.ok(user);
    }
}
