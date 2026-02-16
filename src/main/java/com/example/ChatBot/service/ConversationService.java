package com.example.ChatBot.service;

import com.example.ChatBot.model.ConversationDocument;
import com.example.ChatBot.model.UserDocument;
import com.example.ChatBot.repository.ConversationRepository;
import com.example.ChatBot.repository.ChatMessageRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;

    public ConversationService(ConversationRepository conversationRepository,
            ChatMessageRepository chatMessageRepository) {
        this.conversationRepository = conversationRepository;
        this.chatMessageRepository = chatMessageRepository;
    }

    /**
     * Get or create a 1:1 conversation between two users (by mobile).
     */
    public ConversationDocument getOrCreate(String mobile1, String mobile2) {
        String m1 = UserDocument.normalizeMobile(mobile1);
        String m2 = UserDocument.normalizeMobile(mobile2);
        if (m1 == null || m2 == null || m1.equals(m2)) {
            throw new IllegalArgumentException("Invalid participants");
        }
        String p1 = m1.compareTo(m2) < 0 ? m1 : m2;
        String p2 = m1.compareTo(m2) < 0 ? m2 : m1;
        return conversationRepository.findByParticipant1AndParticipant2(p1, p2)
                .orElseGet(() -> conversationRepository.save(new ConversationDocument(p1, p2)));
    }

    /**
     * List conversations for a user, most recent first.
     */
    public List<ConversationDocument> listForUser(String mobile) {
        String m = UserDocument.normalizeMobile(mobile);
        if (m == null)
            return List.of();
        Sort sort = Sort.by(Sort.Direction.DESC, "lastMessageAt");
        return conversationRepository.findByParticipant1OrParticipant2(m, m, sort);
    }

    public void updateLastMessage(String conversationId, String preview) {
        conversationRepository.findById(conversationId).ifPresent(conv -> {
            conv.setLastMessageAt(System.currentTimeMillis());
            conv.setLastMessagePreview(preview != null && preview.length() > 100 ? preview.substring(0, 100) : preview);
            conversationRepository.save(conv);
        });
    }

    /**
     * Update last message preview with a specific timestamp (used after message
     * deletion
     * to set the timestamp to the actual latest remaining message's time).
     */
    public void updateLastMessageWithTimestamp(String conversationId, String preview, long timestamp) {
        conversationRepository.findById(conversationId).ifPresent(conv -> {
            conv.setLastMessageAt(timestamp);
            conv.setLastMessagePreview(preview != null && preview.length() > 100 ? preview.substring(0, 100) : preview);
            conversationRepository.save(conv);
        });
    }

    /**
     * Delete a conversation and all its messages.
     * Returns true if deleted, false if not found or not authorized.
     */
    public boolean deleteConversation(String conversationId, String mobile) {
        String m = UserDocument.normalizeMobile(mobile);
        if (m == null || conversationId == null)
            return false;

        return conversationRepository.findById(conversationId)
                .filter(conv -> m.equals(conv.getParticipant1()) || m.equals(conv.getParticipant2()))
                .map(conv -> {
                    chatMessageRepository.deleteByConversationId(conversationId);
                    conversationRepository.delete(conv);
                    return true;
                })
                .orElse(false);
    }

    /**
     * Fast check if a user is a participant in a conversation without loading all
     * conversations.
     */
    public boolean isUserParticipant(String conversationId, String mobile) {
        String m = UserDocument.normalizeMobile(mobile);
        if (m == null || conversationId == null)
            return false;
        return conversationRepository.existsByIdAndParticipant1(conversationId, m)
                || conversationRepository.existsByIdAndParticipant2(conversationId, m);
    }

    /**
     * Get a conversation by ID.
     */
    public ConversationDocument getById(String conversationId) {
        if (conversationId == null)
            return null;
        return conversationRepository.findById(conversationId).orElse(null);
    }

    /**
     * Mark a conversation as read by a user. Returns the updated conversation.
     */
    public ConversationDocument markAsRead(String conversationId, String mobile) {
        String m = UserDocument.normalizeMobile(mobile);
        if (m == null || conversationId == null)
            return null;

        return conversationRepository.findById(conversationId)
                .filter(conv -> m.equals(conv.getParticipant1()) || m.equals(conv.getParticipant2()))
                .map(conv -> {
                    conv.markReadBy(m, System.currentTimeMillis());
                    return conversationRepository.save(conv);
                })
                .orElse(null);
    }
}
