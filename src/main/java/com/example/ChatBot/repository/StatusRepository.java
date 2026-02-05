package com.example.ChatBot.repository;

import com.example.ChatBot.model.StatusDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface StatusRepository extends MongoRepository<StatusDocument, String> {

    /**
     * Find all active statuses for a specific user.
     */
    List<StatusDocument> findByUserMobileAndExpiresAtGreaterThan(String userMobile, long currentTime);

    /**
     * Find all active statuses (not expired), ordered by creation time descending.
     */
    List<StatusDocument> findByExpiresAtGreaterThanOrderByCreatedAtDesc(long currentTime);

    /**
     * Delete expired statuses (cleanup).
     */
    void deleteByExpiresAtLessThan(long currentTime);
}
