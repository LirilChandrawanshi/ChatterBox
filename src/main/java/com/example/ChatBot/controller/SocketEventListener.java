package com.example.ChatBot.controller;

import com.example.ChatBot.service.PresenceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

@Component
public class SocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(SocketEventListener.class);

    private final PresenceService presenceService;

    public SocketEventListener(PresenceService presenceService) {
        this.presenceService = presenceService;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();
        if (principal != null && !"anonymous".equals(principal.getName())) {
            presenceService.setOnline(principal.getName());
            logger.info("User connected: {}", principal.getName());
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();
        if (principal != null) {
            presenceService.setOffline(principal.getName());
            logger.info("User disconnected: {}", principal.getName());
        }
    }
}
