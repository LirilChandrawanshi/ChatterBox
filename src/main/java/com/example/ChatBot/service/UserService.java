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
