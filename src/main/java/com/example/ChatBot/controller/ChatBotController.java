package com.example.ChatBot.controller;

import com.example.ChatBot.model.Entity;
import com.example.ChatBot.service.ChatService;
import com.example.ChatBot.service.ConversationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import javax.validation.Valid;

@Slf4j
@Controller
public class ChatBotController {


    private final ChatService chatService;
    private final ConversationService conversationService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatBotController(ChatService chatService, ConversationService conversationService,
            SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.conversationService = conversationService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public Entity sendMessage(@Payload @Valid Entity chatMessage) {
        log.info("Received message from {}: {}", chatMessage.getSender(), chatMessage.getContent());


        if (chatMessage.getContent() != null) {
            chatMessage.setContent(sanitizeInput(chatMessage.getContent()));
        }

        chatMessage.setTimestamp(System.currentTimeMillis());
        String savedId = chatService.saveIfPersistable(chatMessage);
        if (savedId != null)
            chatMessage.setId(savedId);
        return chatMessage;
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public Entity addUser(@Payload @Valid Entity chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        log.info("User joined: {}", chatMessage.getSender());

        // Store username in session
        var sessionAttributes = headerAccessor.getSessionAttributes();
        if (sessionAttributes != null) {
            sessionAttributes.put("username", chatMessage.getSender());
        }
        chatMessage.setTimestamp(System.currentTimeMillis());
        return chatMessage;
    }

    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload @Valid Entity chatMessage) {
        log.debug("User typing: {} in conversation: {}", chatMessage.getSender(), chatMessage.getConversationId());

        // If conversationId is provided, send to the other participant in 1:1 chat
        if (chatMessage.getConversationId() != null) {
            String convId = chatMessage.getConversationId();
            String sender = chatMessage.getSender();

            // Find the conversation and get other participant
            conversationService.listForUser(sender).stream()
                    .filter(c -> c.getId().equals(convId))
                    .findFirst()
                    .ifPresent(conv -> {
                        String otherMobile = conv.getOtherParticipant(sender);
                        chatMessage.setTimestamp(System.currentTimeMillis());
                        messagingTemplate.convertAndSendToUser(otherMobile, "/queue/messages", chatMessage);
                    });
        } else {
            // Legacy: broadcast to public topic for old chat room
            messagingTemplate.convertAndSend("/topic/public", chatMessage);
        }
    }

    @MessageMapping("/chat.read")
    public void handleReadReceipt(@Payload @Valid Entity chatMessage) {
        log.debug("Read receipt from: {} in conversation: {}", chatMessage.getSender(),
                chatMessage.getConversationId());

        if (chatMessage.getConversationId() != null) {
            String convId = chatMessage.getConversationId();
            String sender = chatMessage.getSender();

            // Persist read status to database
            var updatedConv = conversationService.markAsRead(convId, sender);
            if (updatedConv == null)
                return;

            // Notify the other participant in real-time
            String otherMobile = updatedConv.getOtherParticipant(sender);
            if (otherMobile != null) {
                chatMessage.setType(Entity.MessageType.READ);
                chatMessage.setTimestamp(System.currentTimeMillis());
                messagingTemplate.convertAndSendToUser(otherMobile, "/queue/messages", chatMessage);
            }
        }
    }

    @MessageMapping("/chat.sendFile")
    @SendTo("/topic/public")
    public Entity sendFile(@Payload @Valid Entity chatMessage) {
        log.error("File shared by {}: {}", chatMessage.getSender(), chatMessage.getFileType());
        chatMessage.setTimestamp(System.currentTimeMillis());
        String savedId = chatService.saveIfPersistable(chatMessage);
        if (savedId != null)
            chatMessage.setId(savedId);
        return chatMessage;
    }

    private String sanitizeInput(String input) {
        if (input == null)
            return null;
        return input.replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")
                .replaceAll("\"", "&quot;")
                .replaceAll("'", "&#x27;")
                .replaceAll("/", "&#x2F;");
    }
}