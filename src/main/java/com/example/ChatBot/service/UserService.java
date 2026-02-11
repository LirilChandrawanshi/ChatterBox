package com.example.ChatBot.service;

import com.example.ChatBot.model.UserDocument;
import com.example.ChatBot.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Sign up: create user with mobile, displayName, and hashed password.
     */
    public UserDocument signup(String mobile, String displayName, String password) {
        String normalized = UserDocument.normalizeMobile(mobile);
        if (normalized == null || normalized.length() < 5) {
            throw new IllegalArgumentException("Invalid mobile number");
        }
        if (password == null || password.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }
        if (userRepository.findByMobile(normalized).isPresent()) {
            throw new IllegalArgumentException("Mobile number already registered");
        }
        UserDocument user = new UserDocument(mobile, displayName);
        user.setHashedPassword(passwordEncoder.encode(password));
        return userRepository.save(user);
    }

    /**
     * Login: verify password and return user, or null if invalid.
     */
    public UserDocument login(String mobile, String password) {
        String normalized = UserDocument.normalizeMobile(mobile);
        if (normalized == null || password == null)
            return null;
        return userRepository.findByMobile(normalized)
                .filter(u -> u.getHashedPassword() != null && passwordEncoder.matches(password, u.getHashedPassword()))
                .orElse(null);
    }

    /**
     * Register or get user by mobile (no password). For backward compatibility.
     */
    public UserDocument registerOrGet(String mobile, String displayName) {
        String normalized = UserDocument.normalizeMobile(mobile);
        if (normalized == null || normalized.length() < 5) {
            throw new IllegalArgumentException("Invalid mobile number");
        }
        return userRepository.findByMobile(normalized)
                .map(existing -> {
                    if (displayName != null && !displayName.isBlank()) {
                        existing.setDisplayName(displayName.trim());
                        return userRepository.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> userRepository.save(new UserDocument(mobile, displayName)));
    }

    public UserDocument findByMobile(String mobile) {
        String normalized = UserDocument.normalizeMobile(mobile);
        return userRepository.findByMobile(normalized).orElse(null);
    }

    /**
     * Batch lookup users by mobile numbers - single DB query for all.
     * Returns a map of mobile -> UserDocument for O(1) lookups.
     */
    public java.util.Map<String, UserDocument> findByMobiles(java.util.List<String> mobiles) {
        if (mobiles == null || mobiles.isEmpty()) {
            return java.util.Collections.emptyMap();
        }
        java.util.List<String> normalized = mobiles.stream()
                .map(UserDocument::normalizeMobile)
                .filter(m -> m != null)
                .distinct()
                .toList();
        java.util.List<UserDocument> users = userRepository.findByMobileIn(normalized);
        return users.stream()
                .collect(java.util.stream.Collectors.toMap(
                        UserDocument::getMobile,
                        u -> u,
                        (a, b) -> a // handle duplicates
                ));
    }

    /**
     * Lightweight batch lookup - only mobile and displayName (no profilePicture,
     * hashedPassword, bio). Use for conversation list to avoid loading large
     * base64 images.
     */
    public java.util.Map<String, String> findDisplayNamesByMobiles(java.util.List<String> mobiles) {
        if (mobiles == null || mobiles.isEmpty()) {
            return java.util.Collections.emptyMap();
        }
        java.util.List<String> normalized = mobiles.stream()
                .map(UserDocument::normalizeMobile)
                .filter(m -> m != null)
                .distinct()
                .toList();
        java.util.List<UserDocument> users = userRepository.findDisplayInfoByMobileIn(normalized);
        return users.stream()
                .collect(java.util.stream.Collectors.toMap(
                        UserDocument::getMobile,
                        u -> u.getDisplayName() != null ? u.getDisplayName() : u.getMobile(),
                        (a, b) -> a));
    }

    /**
     * Update user's display name.
     */
    public UserDocument updateDisplayName(String mobile, String newDisplayName) {
        String normalized = UserDocument.normalizeMobile(mobile);
        UserDocument user = userRepository.findByMobile(normalized).orElse(null);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }
        if (newDisplayName != null && !newDisplayName.isBlank()) {
            user.setDisplayName(newDisplayName.trim());
            return userRepository.save(user);
        }
        return user;
    }

    /**
     * Update user's profile picture (base64 encoded).
     */
    public UserDocument updateProfilePicture(String mobile, String base64Picture) {
        String normalized = UserDocument.normalizeMobile(mobile);
        UserDocument user = userRepository.findByMobile(normalized).orElse(null);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }
        user.setProfilePicture(base64Picture);
        return userRepository.save(user);
    }

    /**
     * Get user's profile picture.
     */
    public String getProfilePicture(String mobile) {
        String normalized = UserDocument.normalizeMobile(mobile);
        UserDocument user = userRepository.findByMobile(normalized).orElse(null);
        return user != null ? user.getProfilePicture() : null;
    }

    /**
     * Update user's bio.
     */
    public UserDocument updateBio(String mobile, String bio) {
        String normalized = UserDocument.normalizeMobile(mobile);
        UserDocument user = userRepository.findByMobile(normalized).orElse(null);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }
        user.setBio(bio);
        return userRepository.save(user);
    }

    /**
     * Get user's bio.
     */
    public String getBio(String mobile) {
        String normalized = UserDocument.normalizeMobile(mobile);
        UserDocument user = userRepository.findByMobile(normalized).orElse(null);
        return user != null ? user.getBio() : null;
    }
}
