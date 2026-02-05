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
    private final ConversationService conversationService;

    public ChatService(ChatMessageRepository repository, ConversationService conversationService) {
        this.repository = repository;
        this.conversationService = conversationService;
    }

    /**
     * Persist a chat message if it's a CHAT or FILE type (with conversationId).
     * 
     * @return the saved document's id, or null if not persisted
     */
    public String saveIfPersistable(Entity message) {
        if (message == null)
            return null;
        if (message.getType() != Entity.MessageType.CHAT && message.getType() != Entity.MessageType.FILE) {
            return null;
        }
        if (message.getConversationId() == null)
            return null;
        ChatMessageDocument doc = ChatMessageDocument.fromEntity(message);
        ChatMessageDocument saved = repository.save(doc);
        String preview = message.getType() == Entity.MessageType.FILE ? "Photo"
                : (message.getContent() != null ? message.getContent() : "");
        conversationService.updateLastMessage(message.getConversationId(), preview);
        return saved.getId();
    }

    /**
     * Delete messages by id. Only persisted (CHAT/FILE) messages have ids.
     * Ignores non-existent ids.
     */
    public void deleteByIds(List<String> ids) {
        if (ids == null || ids.isEmpty())
            return;
        repository.deleteAllById(ids);
    }

    /**
     * Get recent message history for a conversation (oldest first for display).
     */
    public List<Entity> getMessagesByConversationId(String conversationId, int limit) {
        if (conversationId == null)
            return List.of();
        if (limit <= 0)
            limit = DEFAULT_HISTORY_LIMIT;
        var pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "timestamp"));
        List<ChatMessageDocument> docs = repository.findByConversationIdOrderByTimestampDesc(conversationId, pageable);
        List<Entity> entities = docs.stream()
                .map(ChatMessageDocument::toEntity)
                .collect(Collectors.toList());
        Collections.reverse(entities);
        return entities;
    }

    /**
     * Legacy: get recent messages without conversation (old public room).
     */
    public List<Entity> getRecentMessages(int limit) {
        if (limit <= 0)
            limit = DEFAULT_HISTORY_LIMIT;
        var pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "timestamp"));
        List<ChatMessageDocument> docs = repository.findByOrderByTimestampDesc(pageable);
        List<Entity> entities = docs.stream()
                .map(ChatMessageDocument::toEntity)
                .collect(Collectors.toList());
        Collections.reverse(entities);
        return entities;
    }

    /**
     * Delete all messages in a conversation.
     */
    public void deleteMessagesByConversationId(String conversationId) {
        if (conversationId == null)
            return;
        repository.deleteByConversationId(conversationId);
    }
}
