package com.example.ChatBot.controller;

import com.example.ChatBot.model.UserDocument;
import com.example.ChatBot.service.JwtService;
import com.example.ChatBot.service.PresenceService;
import com.example.ChatBot.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final PresenceService presenceService;
    private final JwtService jwtService;

    public UserController(UserService userService, PresenceService presenceService, JwtService jwtService) {
        this.userService = userService;
        this.presenceService = presenceService;
        this.jwtService = jwtService;
    }

    /**
     * GET /api/users/me
     * With header "Authorization: Bearer <token>" returns user for that token.
     * With query ?mobile=xxx also supported (for backward compatibility).
     */
    @GetMapping("/me")
    public ResponseEntity<UserDocument> me(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) String mobile) {
        String resolvedMobile = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            resolvedMobile = jwtService.validateAndGetMobile(authHeader.substring(7));
        }
        if (resolvedMobile == null) resolvedMobile = mobile;
        if (resolvedMobile == null) return ResponseEntity.status(401).build();
        UserDocument user = userService.findByMobile(resolvedMobile);
        return user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();
    }

    /**
     * GET /api/users/online
     * Returns list of mobile numbers currently online (connected via WebSocket).
     */
    @GetMapping("/online")
    public ResponseEntity<List<String>> online() {
        return ResponseEntity.ok(presenceService.getOnlineMobiles().stream().collect(Collectors.toList()));
    }
}
