package com.example.ChatBot.controller;

import com.example.ChatBot.model.UserDocument;
import com.example.ChatBot.service.JwtService;
import com.example.ChatBot.service.PresenceService;
import com.example.ChatBot.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
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
        if (resolvedMobile == null)
            resolvedMobile = mobile;
        if (resolvedMobile == null)
            return ResponseEntity.status(401).build();
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

    /**
     * PUT /api/users/profile
     * Update user's display name.
     */
    @PutMapping("/profile")
    public ResponseEntity<UserDocument> updateProfile(
            @RequestParam String mobile,
            @RequestBody Map<String, String> body) {
        try {
            String displayName = body.get("displayName");
            UserDocument user = userService.updateDisplayName(mobile, displayName);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * PUT /api/users/profile/picture
     * Update user's profile picture.
     */
    @PutMapping("/profile/picture")
    public ResponseEntity<Void> updateProfilePicture(
            @RequestParam String mobile,
            @RequestBody Map<String, String> body) {
        try {
            String picture = body.get("picture");
            userService.updateProfilePicture(mobile, picture);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * GET /api/users/profile/picture
     * Get user's profile picture.
     */
    @GetMapping("/profile/picture")
    public ResponseEntity<Map<String, String>> getProfilePicture(@RequestParam String mobile) {
        String picture = userService.getProfilePicture(mobile);
        return ResponseEntity.ok(Map.of("picture", picture != null ? picture : ""));
    }
}
