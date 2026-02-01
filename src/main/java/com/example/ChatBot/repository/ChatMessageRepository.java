package com.example.ChatBot.repository;

import com.example.ChatBot.model.ChatMessageDocument;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessageDocument, String> {

    /**
     * Find the most recent messages, ordered by timestamp descending.
     * Used to load message history for new users.
     */
    List<ChatMessageDocument> findByOrderByTimestampDesc(Pageable pageable);
}
