package com.example.ChatBot.service;

import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tracks which users (by mobile) are currently connected via WebSocket.
 */
@Service
public class PresenceService {

    private final Set<String> onlineMobiles = ConcurrentHashMap.newKeySet();

    public void setOnline(String mobile) {
        if (mobile != null && !mobile.equals("anonymous")) {
            onlineMobiles.add(mobile);
        }
    }

    public void setOffline(String mobile) {
        if (mobile != null) {
            onlineMobiles.remove(mobile);
        }
    }

    public boolean isOnline(String mobile) {
        return mobile != null && onlineMobiles.contains(mobile);
    }

    public Set<String> getOnlineMobiles() {
        return Collections.unmodifiableSet(onlineMobiles);
    }
}
