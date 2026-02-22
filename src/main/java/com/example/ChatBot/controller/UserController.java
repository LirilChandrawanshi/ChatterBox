package com.example.ChatBot.controller;

import com.example.ChatBot.dto.user.*;
import com.example.ChatBot.model.UserDocument;
import com.example.ChatBot.service.JwtService;
import com.example.ChatBot.service.PresenceService;
import com.example.ChatBot.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
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
    public ResponseEntity<UserResponse> me(
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
        return user != null ? ResponseEntity.ok(UserResponse.from(user)) : ResponseEntity.notFound().build();
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
     * GET /api/users/count
     * Returns total number of users in the database. Public, no auth required.
     */
    @GetMapping("/count")
    public ResponseEntity<UserCountResponse> count() {
        return ResponseEntity.ok(new UserCountResponse(userService.getTotalUserCount()));
    }

    /**
     * PUT /api/users/profile
     * Update user's display name.
     */
    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @RequestParam String mobile,
            @Valid @RequestBody UpdateDisplayNameRequest request) {
        try {
            UserDocument user = userService.updateDisplayName(mobile, request.getDisplayName());
            return ResponseEntity.ok(UserResponse.from(user));
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
            @Valid @RequestBody UpdateProfilePictureRequest request) {
        try {
            userService.updateProfilePicture(mobile, request.getPicture());
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
    public ResponseEntity<ProfilePictureResponse> getProfilePicture(@RequestParam String mobile) {
        String picture = userService.getProfilePicture(mobile);
        return ResponseEntity.ok(new ProfilePictureResponse(picture != null ? picture : ""));
    }

    /**
     * PUT /api/users/profile/bio
     * Update user's bio.
     */
    @PutMapping("/profile/bio")
    public ResponseEntity<UserResponse> updateBio(
            @RequestParam String mobile,
            @Valid @RequestBody UpdateBioRequest request) {
        try {
            UserDocument user = userService.updateBio(mobile, request.getBio());
            return ResponseEntity.ok(UserResponse.from(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * GET /api/users/profile/bio
     * Get user's bio.
     */
    @GetMapping("/profile/bio")
    public ResponseEntity<BioResponse> getBio(@RequestParam String mobile) {
        String bio = userService.getBio(mobile);
        return ResponseEntity.ok(new BioResponse(bio != null ? bio : ""));
    }

    /**
     * GET /api/users/profile/{mobile}
     * Get any user's public profile (name, bio, picture).
     */
    @GetMapping("/profile/{mobile}")
    public ResponseEntity<UserProfileResponse> getPublicProfile(@PathVariable String mobile) {
        UserDocument user = userService.findByMobile(mobile);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(UserProfileResponse.from(user));
    }
}
