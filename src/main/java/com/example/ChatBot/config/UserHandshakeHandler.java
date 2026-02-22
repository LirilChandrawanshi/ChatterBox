package com.example.ChatBot.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Sets the WebSocket user principal from query param ?mobile=xxx
 * so that convertAndSendToUser(mobile, "/queue/messages", ...) works.
 */
public class UserHandshakeHandler extends DefaultHandshakeHandler {

    private static final Pattern MOBILE_PARAM = Pattern.compile("(?:^|&)mobile=([^&]*)");

    @Override
    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler handler,
            Map<String, Object> attributes) {
        String query = request.getURI().getQuery();
        if (query != null) {
            var matcher = MOBILE_PARAM.matcher(query);
            if (matcher.find()) {
                String mobile = java.net.URLDecoder.decode(matcher.group(1).trim(),
                        java.nio.charset.StandardCharsets.UTF_8);
                // Preserve OAuth identifiers (e.g. "google_user@email.com")
                if (mobile.startsWith("google_") && mobile.length() >= 8) {
                    final String user = mobile;
                    return () -> user;
                }
                String normalized = mobile.replaceAll("[^0-9]", "");
                if (normalized.length() >= 5) {
                    final String user = normalized;
                    return () -> user;
                }
            }
        }
        return () -> "anonymous";
    }
}
