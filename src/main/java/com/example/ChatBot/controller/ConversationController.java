package com.example.ChatBot.controller;

import com.example.ChatBot.model.ConversationDocument;
import com.example.ChatBot.model.Entity;
import com.example.ChatBot.model.UserDocument;
import com.example.ChatBot.service.ChatService;
import com.example.ChatBot.service.ConversationService;
import com.example.ChatBot.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ConversationService conversationService;
    private final UserService userService;
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public ConversationController(ConversationService conversationService, UserService userService,
            ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.conversationService = conversationService;
        this.userService = userService;
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * GET /api/conversations?mobile=xxx
     * List conversations for the user (most recent first), with other participant
     * info.
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(@RequestParam String mobile) {
        List<ConversationDocument> list = conversationService.listForUser(mobile);
        List<Map<String, Object>> result = list.stream().map(conv -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", conv.getId());
            map.put("participant1", conv.getParticipant1());
            map.put("participant2", conv.getParticipant2());
            map.put("lastMessageAt", conv.getLastMessageAt());
            map.put("lastMessagePreview", conv.getLastMessagePreview());
            String otherMobile = conv.getOtherParticipant(mobile);
            map.put("otherParticipantMobile", otherMobile);
            UserDocument otherUser = userService.findByMobile(otherMobile);
            map.put("otherParticipantName", otherUser != null ? otherUser.getDisplayName() : otherMobile);
            return map;
        }).toList();
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/conversations?mobile=xxx
     * Body: { "otherUserMobile": "+9876543210" }
     * Get or create conversation with the other user.
     */
    @PostMapping
    public ResponseEntity<?> getOrCreate(@RequestParam String mobile, @RequestBody Map<String, String> body) {
        String other = body != null ? body.get("otherUserMobile") : null;
        if (other == null || other.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        ConversationDocument conv = conversationService.getOrCreate(mobile, other);
        Map<String, Object> response = new HashMap<>();
        response.put("id", conv.getId());
        response.put("participant1", conv.getParticipant1());
        response.put("participant2", conv.getParticipant2());
        response.put("lastMessageAt", conv.getLastMessageAt());
        response.put("lastMessagePreview", conv.getLastMessagePreview());
        String otherMobile = conv.getOtherParticipant(mobile);
        UserDocument otherUser = userService.findByMobile(otherMobile);
        response.put("otherParticipantMobile", otherMobile);
        response.put("otherParticipantName", otherUser != null ? otherUser.getDisplayName() : otherMobile);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/conversations/:id?mobile=xxx
     * Get conversation and other participant info.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> get(@PathVariable String id, @RequestParam String mobile) {
        return conversationService.listForUser(mobile).stream()
                .filter(c -> c.getId().equals(id))
                .findFirst()
                .map(conv -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", conv.getId());
                    map.put("otherParticipantMobile", conv.getOtherParticipant(mobile));
                    UserDocument other = userService.findByMobile(conv.getOtherParticipant(mobile));
                    map.put("otherParticipantName",
                            other != null ? other.getDisplayName() : conv.getOtherParticipant(mobile));
                    map.put("lastMessageAt", conv.getLastMessageAt());
                    map.put("lastMessagePreview", conv.getLastMessagePreview());
                    return ResponseEntity.ok(map);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/conversations/:id/messages?limit=50
     * Messages for this conversation (oldest first).
     */
    @GetMapping("/{id}/messages")
    public ResponseEntity<List<Entity>> getMessages(@PathVariable String id, @RequestParam String mobile,
            @RequestParam(defaultValue = "50") int limit) {
        if (limit > 100)
            limit = 100;
        // Verify user is participant
        boolean allowed = conversationService.listForUser(mobile).stream()
                .anyMatch(c -> c.getId().equals(id));
        if (!allowed)
            return ResponseEntity.notFound().build();
        List<Entity> messages = chatService.getMessagesByConversationId(id, limit);
        return ResponseEntity.ok(messages);
    }

    /**
     * POST /api/conversations/:id/messages
     * Body: { "content": "Hello" } for text, or { "fileContent": "base64...",
     * "fileType": "image/jpeg" } for file/image.
     * Sends message and pushes to both participants via WebSocket.
     */
    @PostMapping("/{id}/messages")
    public ResponseEntity<Entity> sendMessage(@PathVariable String id, @RequestParam String mobile,
            @RequestBody Map<String, Object> body) {
        List<ConversationDocument> myConvs = conversationService.listForUser(mobile);
        ConversationDocument conv = myConvs.stream().filter(c -> c.getId().equals(id)).findFirst().orElse(null);
        if (conv == null)
            return ResponseEntity.notFound().build();

        String otherMobile = conv.getOtherParticipant(mobile);
        Entity message = new Entity();
        message.setSender(mobile);
        message.setConversationId(id);
        message.setTimestamp(System.currentTimeMillis());

        String fileContent = body != null && body.get("fileContent") != null ? body.get("fileContent").toString()
                : null;
        String fileType = body != null && body.get("fileType") != null ? body.get("fileType").toString() : null;
        String content = body != null && body.get("content") != null ? body.get("content").toString() : "";

        if (fileContent != null && !fileContent.isBlank() && fileType != null && !fileType.isBlank()) {
            message.setType(Entity.MessageType.FILE);
            message.setFileContent(fileContent);
            message.setFileType(fileType);
            message.setContent("");
        } else {
            message.setType(Entity.MessageType.CHAT);
            message.setContent(sanitize(content));
        }

        String savedId = chatService.saveIfPersistable(message);
        if (savedId != null)
            message.setId(savedId);

        messagingTemplate.convertAndSendToUser(mobile, "/queue/messages", message);
        messagingTemplate.convertAndSendToUser(otherMobile, "/queue/messages", message);

        return ResponseEntity.ok(message);
    }

    /**
     * DELETE /api/conversations/:id?mobile=xxx
     * Delete a conversation and all its messages.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConversation(@PathVariable String id, @RequestParam String mobile) {
        boolean deleted = conversationService.deleteConversation(id, mobile);
        return deleted ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    private static String sanitize(String input) {
        if (input == null)
            return null;
        return input.replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")
                .replaceAll("\"", "&quot;")
                .replaceAll("'", "&#x27;")
                .replaceAll("/", "&#x2F;");
    }
}
