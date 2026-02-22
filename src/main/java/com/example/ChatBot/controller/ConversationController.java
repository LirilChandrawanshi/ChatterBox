package com.example.ChatBot.controller;

import com.example.ChatBot.dto.chat.ChatMessageResponse;
import com.example.ChatBot.dto.chat.ConversationResponse;
import com.example.ChatBot.dto.chat.CreateConversationRequest;
import com.example.ChatBot.dto.chat.SendMessageRequest;
import com.example.ChatBot.model.ConversationDocument;
import com.example.ChatBot.model.GroupDocument;
import com.example.ChatBot.model.MessageType;
import com.example.ChatBot.model.UserDocument;
import com.example.ChatBot.service.ChatService;
import com.example.ChatBot.service.ConversationService;
import com.example.ChatBot.service.GroupService;
import com.example.ChatBot.service.UserService;
import com.example.ChatBot.util.InputSanitizer;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ConversationService conversationService;
    private final UserService userService;
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final GroupService groupService;

    public ConversationController(ConversationService conversationService, UserService userService,
            ChatService chatService, SimpMessagingTemplate messagingTemplate, GroupService groupService) {
        this.conversationService = conversationService;
        this.userService = userService;
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
        this.groupService = groupService;
    }

    /**
     * GET /api/conversations?mobile=xxx
     * List conversations for the user (most recent first), with other participant
     * info.
     * OPTIMIZED: Uses batch user lookup to avoid N+1 queries.
     */
    @GetMapping
    public ResponseEntity<List<ConversationResponse>> list(@RequestParam String mobile) {
        List<ConversationDocument> list = conversationService.listForUser(mobile);

        List<String> otherMobiles = list.stream()
                .map(conv -> conv.getOtherParticipant(mobile))
                .distinct()
                .toList();

        Map<String, String> displayNameMap = userService.findDisplayNamesByMobiles(otherMobiles);

        List<ConversationResponse> result = list.stream().map(conv -> {
            String otherMobile = conv.getOtherParticipant(mobile);
            return ConversationResponse.builder()
                    .id(conv.getId())
                    .participant1(conv.getParticipant1())
                    .participant2(conv.getParticipant2())
                    .lastMessageAt(conv.getLastMessageAt())
                    .lastMessagePreview(conv.getLastMessagePreview())
                    .otherParticipantMobile(otherMobile)
                    .otherParticipantName(displayNameMap.getOrDefault(otherMobile, otherMobile))
                    .build();
        }).toList();

        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/conversations?mobile=xxx
     * Get or create conversation with the other user.
     */
    @PostMapping
    public ResponseEntity<?> getOrCreate(@RequestParam String mobile,
            @RequestBody @Valid CreateConversationRequest request) {
        String other = request.getOtherUserMobile();

        UserDocument otherUser = userService.findByMobile(other);
        if (otherUser == null) {
            return ResponseEntity.status(404)
                    .body(Map.of("error", "User not found with mobile number: " + other));
        }

        ConversationDocument conv = conversationService.getOrCreate(mobile, other);
        String otherMobile = conv.getOtherParticipant(mobile);

        ConversationResponse response = ConversationResponse.builder()
                .id(conv.getId())
                .participant1(conv.getParticipant1())
                .participant2(conv.getParticipant2())
                .lastMessageAt(conv.getLastMessageAt())
                .lastMessagePreview(conv.getLastMessagePreview())
                .otherParticipantMobile(otherMobile)
                .otherParticipantName(
                        otherUser.getDisplayName() != null ? otherUser.getDisplayName() : otherMobile)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/conversations/:id?mobile=xxx
     * Get conversation and other participant info.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ConversationResponse> get(@PathVariable String id, @RequestParam String mobile) {
        return conversationService.listForUser(mobile).stream()
                .filter(c -> c.getId().equals(id))
                .findFirst()
                .map(conv -> {
                    String otherMobile = conv.getOtherParticipant(mobile);
                    UserDocument other = userService.findByMobile(otherMobile);

                    ConversationResponse response = ConversationResponse.builder()
                            .id(conv.getId())
                            .otherParticipantMobile(otherMobile)
                            .otherParticipantName(
                                    other != null ? other.getDisplayName() : otherMobile)
                            .lastMessageAt(conv.getLastMessageAt())
                            .lastMessagePreview(conv.getLastMessagePreview())
                            .otherLastReadAt(conv.getLastReadBy(otherMobile))
                            .build();

                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/conversations/:id/messages?limit=50
     * Messages for this conversation (oldest first).
     */
    @GetMapping("/{id}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(@PathVariable String id,
            @RequestParam String mobile, @RequestParam(defaultValue = "50") int limit) {
        if (limit > 100)
            limit = 100;

        boolean isConversationParticipant = conversationService.isUserParticipant(id, mobile);
        boolean isGroupMember = groupService.isUserMember(id, mobile);

        if (!isConversationParticipant && !isGroupMember) {
            return ResponseEntity.notFound().build();
        }

        List<ChatMessageResponse> messages = chatService.getMessagesByConversationId(id, limit);
        return ResponseEntity.ok(messages);
    }

    /**
     * POST /api/conversations/:id/messages
     * Sends message and pushes to both participants via WebSocket.
     */
    @PostMapping("/{id}/messages")
    public ResponseEntity<ChatMessageResponse> sendMessage(@PathVariable String id,
            @RequestParam String mobile, @RequestBody @Valid SendMessageRequest request) {

        GroupDocument group = groupService.getGroup(id);
        ConversationDocument conv = null;

        if (group != null) {
            if (!group.getMembers().contains(mobile)) {
                return ResponseEntity.notFound().build();
            }
        } else {
            List<ConversationDocument> myConvs = conversationService.listForUser(mobile);
            conv = myConvs.stream().filter(c -> c.getId().equals(id)).findFirst().orElse(null);
            if (conv == null) {
                return ResponseEntity.notFound().build();
            }
        }

        // Build the response message from the typed request DTO
        boolean isFile = request.getFileContent() != null && !request.getFileContent().isBlank()
                && request.getFileType() != null && !request.getFileType().isBlank();

        ChatMessageResponse message = ChatMessageResponse.builder()
                .sender(mobile)
                .conversationId(id)
                .timestamp(System.currentTimeMillis())
                .type(isFile ? MessageType.FILE : MessageType.CHAT)
                .content(isFile ? "" : InputSanitizer.sanitize(request.getContent()))
                .fileContent(isFile ? request.getFileContent() : null)
                .fileType(isFile ? request.getFileType() : null)
                .replyToId(request.getReplyToId())
                .replyToContent(request.getReplyToContent())
                .replyToSender(request.getReplyToSender())
                .build();

        String savedId = chatService.saveIfPersistable(message);
        if (savedId != null) {
            message.setId(savedId);
        }

        // Send message to appropriate recipients
        if (group != null) {
            for (String memberMobile : group.getMembers()) {
                messagingTemplate.convertAndSendToUser(memberMobile, "/queue/messages", message);
            }
            group.setLastMessageAt(message.getTimestamp());
            group.setLastMessagePreview(message.getContent() != null && !message.getContent().isEmpty()
                    ? message.getContent()
                    : "[File]");
            UserDocument sender = userService.findByMobile(mobile);
            group.setLastMessageSenderName(sender != null ? sender.getDisplayName() : mobile);
            groupService.save(group);
        } else {
            String otherMobile = conv.getOtherParticipant(mobile);
            messagingTemplate.convertAndSendToUser(mobile, "/queue/messages", message);
            messagingTemplate.convertAndSendToUser(otherMobile, "/queue/messages", message);
        }

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
}
