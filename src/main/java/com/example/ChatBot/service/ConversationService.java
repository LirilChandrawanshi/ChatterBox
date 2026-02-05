package com.example.ChatBot.service;

import com.example.ChatBot.model.ConversationDocument;
import com.example.ChatBot.model.UserDocument;
import com.example.ChatBot.repository.ConversationRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConversationService {

    private final ConversationRepository conversationRepository;

    public ConversationService(ConversationRepository conversationRepository) {
        this.conversationRepository = conversationRepository;
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
        if (m == null) return List.of();
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
}
