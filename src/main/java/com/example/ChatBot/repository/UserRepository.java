package com.example.ChatBot.repository;

import com.example.ChatBot.model.UserDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<UserDocument, String> {

    Optional<UserDocument> findByMobile(String mobile);

    // Batch lookup - fetch multiple users in a single query
    List<UserDocument> findByMobileIn(List<String> mobiles);

    /**
     * Lightweight batch lookup - returns only mobile and displayName (excludes
     * profilePicture, hashedPassword, bio). Use for conversation list to avoid
     * loading large base64 images.
     */
    @Query(value = "{ 'mobile' : { $in : ?0 } }", fields = "{ 'mobile' : 1, 'displayName' : 1 }")
    List<UserDocument> findDisplayInfoByMobileIn(List<String> mobiles);
}
