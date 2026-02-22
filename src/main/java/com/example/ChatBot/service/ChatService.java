package com.example.ChatBot.service;

import com.example.ChatBot.dto.chat.ChatMessageResponse;
import com.example.ChatBot.model.ChatMessageDocument;
import com.example.ChatBot.model.MessageType;
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
    public String saveIfPersistable(ChatMessageResponse message) {
        if (message == null)
            return null;
        if (message.getType() != MessageType.CHAT && message.getType() != MessageType.FILE) {
            return null;
        }
        if (message.getConversationId() == null)
            return null;

        ChatMessageDocument doc = ChatMessageDocument.fromResponse(message);
        ChatMessageDocument saved = repository.save(doc);

        String preview = message.getType() == MessageType.FILE ? "Photo"
                : (message.getContent() != null ? message.getContent() : "");
        conversationService.updateLastMessage(message.getConversationId(), preview);
        return saved.getId();
    }

    /**
     * Delete messages by id. Only persisted (CHAT/FILE) messages have ids.
     * Ignores non-existent ids.
     * After deletion, updates the conversation's lastMessagePreview to reflect the
     * new latest message.
     */
    public void deleteByIds(List<String> ids) {
        if (ids == null || ids.isEmpty())
            return;

        // Find the affected conversation IDs before deleting
        java.util.Set<String> affectedConversationIds = new java.util.HashSet<>();
        repository.findAllById(ids).forEach(doc -> {
            if (doc.getConversationId() != null) {
                affectedConversationIds.add(doc.getConversationId());
            }
        });

        // Delete the messages
        repository.deleteAllById(ids);

        // Update lastMessagePreview for each affected conversation
        for (String convId : affectedConversationIds) {
            var pageable = PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "timestamp"));
            List<ChatMessageDocument> remaining = repository.findByConversationIdOrderByTimestampDesc(convId, pageable);
            if (remaining.isEmpty()) {
                conversationService.updateLastMessage(convId, null);
            } else {
                ChatMessageDocument latest = remaining.get(0);
                String preview = latest.getType() == MessageType.FILE ? "Photo"
                        : (latest.getContent() != null ? latest.getContent() : "");
                conversationService.updateLastMessageWithTimestamp(convId, preview, latest.getTimestamp());
            }
        }
    }

    /**
     * Get recent message history for a conversation (oldest first for display).
     */
    public List<ChatMessageResponse> getMessagesByConversationId(String conversationId, int limit) {
        if (conversationId == null)
            return List.of();
        if (limit <= 0)
            limit = DEFAULT_HISTORY_LIMIT;

        var pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "timestamp"));
        List<ChatMessageDocument> docs = repository.findByConversationIdOrderByTimestampDesc(conversationId, pageable);

        List<ChatMessageResponse> messages = docs.stream()
                .map(ChatMessageDocument::toResponse)
                .collect(Collectors.toList());
        Collections.reverse(messages);
        return messages;
    }

    /**
     * Legacy: get recent messages without conversation (old public room).
     */
    public List<ChatMessageResponse> getRecentMessages(int limit) {
        if (limit <= 0)
            limit = DEFAULT_HISTORY_LIMIT;

        var pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "timestamp"));
        List<ChatMessageDocument> docs = repository.findByOrderByTimestampDesc(pageable);

        List<ChatMessageResponse> messages = docs.stream()
                .map(ChatMessageDocument::toResponse)
                .collect(Collectors.toList());
        Collections.reverse(messages);
        return messages;
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
