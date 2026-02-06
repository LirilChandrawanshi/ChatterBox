package com.example.ChatBot.repository;

import com.example.ChatBot.model.ConversationDocument;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends MongoRepository<ConversationDocument, String> {

    Optional<ConversationDocument> findByParticipant1AndParticipant2(String p1, String p2);

    List<ConversationDocument> findByParticipant1OrParticipant2(String p1, String p2, Sort sort);

    // Fast check if user is a participant in a conversation
    boolean existsByIdAndParticipant1(String id, String participant1);

    boolean existsByIdAndParticipant2(String id, String participant2);
}
