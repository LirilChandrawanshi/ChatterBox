package com.example.ChatBot.repository;

import com.example.ChatBot.model.GroupDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface GroupRepository extends MongoRepository<GroupDocument, String> {

    // Find groups where the member list contains the given mobile
    List<GroupDocument> findByMembers(String mobile);
}
