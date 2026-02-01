package com.example.ChatBot.controller;

import com.example.ChatBot.model.Entity;
import com.example.ChatBot.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import javax.validation.Valid;

@Controller
public class ChatBotController {

    private static final Logger logger = LoggerFactory.getLogger(ChatBotController.class);

    private final ChatService chatService;

    public ChatBotController(ChatService chatService) {
        this.chatService = chatService;
    }

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public Entity sendMessage(@Payload @Valid Entity chatMessage) {
        logger.debug("Received message from {}: {}", chatMessage.getSender(), chatMessage.getContent());
        
        // Sanitize content to prevent XSS
        if (chatMessage.getContent() != null) {
            chatMessage.setContent(sanitizeInput(chatMessage.getContent()));
        }
        
        chatMessage.setTimestamp(System.currentTimeMillis());
        chatService.saveIfPersistable(chatMessage);
        return chatMessage;
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public Entity addUser(@Payload @Valid Entity chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        logger.info("User joined: {}", chatMessage.getSender());
        
        // Store username in session
        var sessionAttributes = headerAccessor.getSessionAttributes();
        if (sessionAttributes != null) {
            sessionAttributes.put("username", chatMessage.getSender());
        }
        chatMessage.setTimestamp(System.currentTimeMillis());
        return chatMessage;
    }

    @MessageMapping("/chat.typing")
    @SendTo("/topic/public")
    public Entity handleTyping(@Payload @Valid Entity chatMessage) {
        logger.debug("User typing: {}", chatMessage.getSender());
        return chatMessage;
    }

    @MessageMapping("/chat.sendFile")
    @SendTo("/topic/public")
    public Entity sendFile(@Payload @Valid Entity chatMessage) {
        logger.info("File shared by {}: {}", chatMessage.getSender(), chatMessage.getFileType());
        chatMessage.setTimestamp(System.currentTimeMillis());
        chatService.saveIfPersistable(chatMessage);
        return chatMessage;
    }

    private String sanitizeInput(String input) {
        if (input == null) return null;
        return input.replaceAll("<", "&lt;")
                   .replaceAll(">", "&gt;")
                   .replaceAll("\"", "&quot;")
                   .replaceAll("'", "&#x27;")
                   .replaceAll("/", "&#x2F;");
    }
}