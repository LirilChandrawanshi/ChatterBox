package com.example.ChatBot.controller;

import com.example.ChatBot.model.StatusDocument;
import com.example.ChatBot.model.UserDocument;
import com.example.ChatBot.repository.StatusRepository;
import com.example.ChatBot.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/status")
public class StatusController {

    private final StatusRepository statusRepository;
    private final UserService userService;

    public StatusController(StatusRepository statusRepository, UserService userService) {
        this.statusRepository = statusRepository;
        this.userService = userService;
    }

    /**
     * POST /api/status?mobile=xxx
     * Create a new status (text and/or image).
     */
    @PostMapping
    public ResponseEntity<StatusDocument> createStatus(
            @RequestParam String mobile,
            @RequestBody Map<String, String> body) {

        String content = body.get("content");
        String imageBase64 = body.get("imageBase64");
        String imageType = body.get("imageType");

        if ((content == null || content.isBlank()) && (imageBase64 == null || imageBase64.isBlank())) {
            return ResponseEntity.badRequest().build();
        }

        UserDocument user = userService.findByMobile(mobile);
        String userName = user != null && user.getDisplayName() != null ? user.getDisplayName() : mobile;

        StatusDocument status = new StatusDocument(mobile, userName, content);
        if (imageBase64 != null && !imageBase64.isBlank()) {
            status.setImageBase64(imageBase64);
            status.setImageType(imageType);
        }

        StatusDocument saved = statusRepository.save(status);
        return ResponseEntity.ok(saved);
    }

    /**
     * GET /api/status?mobile=xxx
     * Get all active statuses grouped by user.
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllStatuses(@RequestParam String mobile) {
        long now = System.currentTimeMillis();
        List<StatusDocument> allStatuses = statusRepository.findByExpiresAtGreaterThanOrderByCreatedAtDesc(now);

        // Group by user
        Map<String, List<StatusDocument>> byUser = allStatuses.stream()
                .collect(Collectors.groupingBy(StatusDocument::getUserMobile));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, List<StatusDocument>> entry : byUser.entrySet()) {
            Map<String, Object> userStatuses = new HashMap<>();
            userStatuses.put("userMobile", entry.getKey());
            userStatuses.put("userName", entry.getValue().get(0).getUserName());
            userStatuses.put("statuses", entry.getValue());
            userStatuses.put("isOwn", entry.getKey().equals(mobile));
            result.add(userStatuses);
        }

        // Sort to show own statuses first
        result.sort((a, b) -> {
            boolean aOwn = (boolean) a.get("isOwn");
            boolean bOwn = (boolean) b.get("isOwn");
            if (aOwn && !bOwn)
                return -1;
            if (!aOwn && bOwn)
                return 1;
            return 0;
        });

        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/status/my?mobile=xxx
     * Get my active statuses.
     */
    @GetMapping("/my")
    public ResponseEntity<List<StatusDocument>> getMyStatuses(@RequestParam String mobile) {
        long now = System.currentTimeMillis();
        List<StatusDocument> myStatuses = statusRepository.findByUserMobileAndExpiresAtGreaterThan(mobile, now);
        return ResponseEntity.ok(myStatuses);
    }

    /**
     * POST /api/status/:id/view?mobile=xxx
     * Mark status as viewed.
     */
    @PostMapping("/{id}/view")
    public ResponseEntity<Void> viewStatus(@PathVariable String id, @RequestParam String mobile) {
        Optional<StatusDocument> opt = statusRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        StatusDocument status = opt.get();
        status.addViewer(mobile);
        statusRepository.save(status);
        return ResponseEntity.ok().build();
    }

    /**
     * DELETE /api/status/:id?mobile=xxx
     * Delete my status.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStatus(@PathVariable String id, @RequestParam String mobile) {
        Optional<StatusDocument> opt = statusRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        StatusDocument status = opt.get();
        if (!status.getUserMobile().equals(mobile)) {
            return ResponseEntity.status(403).build();
        }
        statusRepository.delete(status);
        return ResponseEntity.ok().build();
    }
}
