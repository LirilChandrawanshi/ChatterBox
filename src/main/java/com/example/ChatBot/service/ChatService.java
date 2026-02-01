package com.example.ChatBot.service;

import com.example.ChatBot.model.ChatMessageDocument;
import com.example.ChatBot.model.Entity;
import com.example.ChatBot.repository.ChatMessageRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private static final int DEFAULT_HISTORY_LIMIT = 50;

    private final ChatMessageRepository repository;

    public ChatService(ChatMessageRepository repository) {
        this.repository = repository;
    }

    /**
     * Persist a chat message if it's a CHAT or FILE type.
     * JOIN, LEAVE, TYPING are not stored.
     */
    public void saveIfPersistable(Entity message) {
        if (message == null) return;
        if (message.getType() != Entity.MessageType.CHAT && message.getType() != Entity.MessageType.FILE) {
            return;
        }
        ChatMessageDocument doc = ChatMessageDocument.fromEntity(message);
        repository.save(doc);
    }

    /**
     * Get recent message history (oldest first for display).
     * Returns up to 50 most recent CHAT/FILE messages.
     */
    public List<Entity> getRecentMessages(int limit) {
        if (limit <= 0) limit = DEFAULT_HISTORY_LIMIT;
        var pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "timestamp"));
        List<ChatMessageDocument> docs = repository.findByOrderByTimestampDesc(pageable);
        List<Entity> entities = docs.stream()
                .map(ChatMessageDocument::toEntity)
                .collect(Collectors.toList());
        Collections.reverse(entities); // Oldest first for display
        return entities;
    }
}
