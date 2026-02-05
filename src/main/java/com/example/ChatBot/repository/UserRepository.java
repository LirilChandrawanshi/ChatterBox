package com.example.ChatBot.repository;

import com.example.ChatBot.model.UserDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<UserDocument, String> {

    Optional<UserDocument> findByMobile(String mobile);
}
