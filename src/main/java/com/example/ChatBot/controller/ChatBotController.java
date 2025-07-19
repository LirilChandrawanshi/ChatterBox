package com.example.ChatBot.controller;

import com.example.ChatBot.model.Entity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
public class ChatBotController {

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public Entity sendMessage(@Payload Entity chatMessage) {
        chatMessage.setTimestamp(System.currentTimeMillis());
        return chatMessage;
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public Entity addUser(@Payload Entity chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        chatMessage.setTimestamp(System.currentTimeMillis());
        return chatMessage;
    }

    @MessageMapping("/chat.typing")
    @SendTo("/topic/public")
    public Entity handleTyping(@Payload Entity chatMessage) {
        return chatMessage;
    }

    @MessageMapping("/chat.sendFile")
    @SendTo("/topic/public")
    public Entity sendFile(@Payload Entity chatMessage) {
        chatMessage.setTimestamp(System.currentTimeMillis());
        return chatMessage;
    }
}