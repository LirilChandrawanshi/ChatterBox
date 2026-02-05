package com.example.ChatBot.controller;

import com.example.ChatBot.model.Entity;
import com.example.ChatBot.model.MessagesDeletedEvent;
import com.example.ChatBot.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class MessageHistoryController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public MessageHistoryController(ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
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

    /**
     * DELETE /api/messages
     * Body: JSON array of message ids, e.g. ["id1", "id2"]
     * Deletes the messages and broadcasts to all clients so they remove them from the UI.
     */
    @DeleteMapping("/messages")
    public ResponseEntity<Void> deleteMessages(@RequestBody List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        chatService.deleteByIds(ids);
        messagingTemplate.convertAndSend("/topic/public", new MessagesDeletedEvent(ids));
        return ResponseEntity.noContent().build();
    }
}
