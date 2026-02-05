package com.example.ChatBot.service;

import com.example.ChatBot.model.GroupDocument;
import com.example.ChatBot.repository.GroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
public class GroupService {

    @Autowired
    private GroupRepository groupRepository;

    public GroupDocument createGroup(String name, String description, String adminMobile, Set<String> members) {
        // Ensure admin is in members (handled by constructor but good to be explicit
        // here mostly for safety)
        members.add(adminMobile);

        GroupDocument group = new GroupDocument(name, adminMobile, members);
        group.setDescription(description);

        return groupRepository.save(group);
    }

    public List<GroupDocument> getMyGroups(String mobile) {
        return groupRepository.findByMembers(mobile);
    }

    public GroupDocument getGroup(String id) {
        return groupRepository.findById(id).orElse(null);
    }

    public GroupDocument save(GroupDocument group) {
        return groupRepository.save(group);
    }
}
