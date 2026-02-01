package com.example.ChatBot.controller;

import com.example.ChatBot.model.Entity;
import com.example.ChatBot.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class MessageHistoryController {

    private final ChatService chatService;

    public MessageHistoryController(ChatService chatService) {
        this.chatService = chatService;
    }

    /**
     * GET /api/messages?limit=50
     * Returns recent chat message history (CHAT and FILE messages only).
     * Default limit is 50. Max 100.
     */
    @GetMapping("/messages")
    public ResponseEntity<List<Entity>> getMessages(
            @RequestParam(defaultValue = "50") int limit) {
        if (limit > 100) limit = 100;
        List<Entity> messages = chatService.getRecentMessages(limit);
        return ResponseEntity.ok(messages);
    }
}
