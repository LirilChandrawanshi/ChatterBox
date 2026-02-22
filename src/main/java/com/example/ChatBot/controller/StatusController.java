package com.example.ChatBot.controller;

import com.example.ChatBot.dto.status.CreateStatusRequest;
import com.example.ChatBot.dto.status.StatusResponse;
import com.example.ChatBot.dto.status.UserStatusesResponse;
import com.example.ChatBot.model.StatusDocument;
import com.example.ChatBot.model.UserDocument;
import com.example.ChatBot.repository.StatusRepository;
import com.example.ChatBot.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
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
    public ResponseEntity<StatusResponse> createStatus(
            @RequestParam String mobile,
            @Valid @RequestBody CreateStatusRequest request) {

        if ((request.getContent() == null || request.getContent().isBlank())
                && (request.getImageBase64() == null || request.getImageBase64().isBlank())) {
            return ResponseEntity.badRequest().build();
        }

        UserDocument user = userService.findByMobile(mobile);
        String userName = user != null && user.getDisplayName() != null ? user.getDisplayName() : mobile;

        StatusDocument status = new StatusDocument(mobile, userName, request.getContent());
        if (request.getImageBase64() != null && !request.getImageBase64().isBlank()) {
            status.setImageBase64(request.getImageBase64());
            status.setImageType(request.getImageType());
        }

        StatusDocument saved = statusRepository.save(status);
        return ResponseEntity.ok(StatusResponse.from(saved));
    }

    /**
     * GET /api/status?mobile=xxx
     * Get all active statuses grouped by user.
     */
    @GetMapping
    public ResponseEntity<List<UserStatusesResponse>> getAllStatuses(@RequestParam String mobile) {
        long now = System.currentTimeMillis();
        List<StatusDocument> allStatuses = statusRepository.findByExpiresAtGreaterThanOrderByCreatedAtDesc(now);

        // Group by user
        Map<String, List<StatusDocument>> byUser = allStatuses.stream()
                .collect(Collectors.groupingBy(StatusDocument::getUserMobile));

        List<UserStatusesResponse> result = byUser.entrySet().stream()
                .map(entry -> UserStatusesResponse.from(entry.getKey(), entry.getValue(), mobile))
                .collect(Collectors.toList());

        // Sort to show own statuses first
        result.sort((a, b) -> {
            if (a.isOwn() && !b.isOwn())
                return -1;
            if (!a.isOwn() && b.isOwn())
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
    public ResponseEntity<List<StatusResponse>> getMyStatuses(@RequestParam String mobile) {
        long now = System.currentTimeMillis();
        List<StatusResponse> myStatuses = statusRepository
                .findByUserMobileAndExpiresAtGreaterThan(mobile, now)
                .stream()
                .map(StatusResponse::from)
                .collect(Collectors.toList());
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
