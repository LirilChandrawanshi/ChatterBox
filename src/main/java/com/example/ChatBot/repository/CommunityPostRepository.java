package com.example.ChatBot.repository;

import com.example.ChatBot.model.CommunityPostDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CommunityPostRepository extends MongoRepository<CommunityPostDocument, String> {

    /**
     * Find all posts ordered by creation time descending (newest first).
     */
    List<CommunityPostDocument> findAllByOrderByCreatedAtDesc();

    /**
     * Find posts by author.
     */
    List<CommunityPostDocument> findByAuthorMobileOrderByCreatedAtDesc(String authorMobile);
}
