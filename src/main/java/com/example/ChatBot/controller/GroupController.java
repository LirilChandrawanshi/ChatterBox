package com.example.ChatBot.controller;

import com.example.ChatBot.model.GroupDocument;
import com.example.ChatBot.service.GroupService;
import com.example.ChatBot.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    @Autowired
    private GroupService groupService;

    @Autowired
    private UserService userService; // Optional validation

    // Create a new group
    @PostMapping
    public ResponseEntity<GroupDocument> createGroup(@RequestBody Map<String, Object> payload) {
        String adminMobile = (String) payload.get("adminMobile");
        String name = (String) payload.get("name");
        String description = (String) payload.get("description");
        List<String> memberList = (List<String>) payload.get("members");

        if (adminMobile == null || name == null) {
            return ResponseEntity.badRequest().build();
        }

        Set<String> members = new java.util.HashSet<>(
                memberList != null ? memberList : java.util.Collections.emptyList());

        GroupDocument group = groupService.createGroup(name, description, adminMobile, members);
        return ResponseEntity.ok(group);
    }

    // Get groups for a user
    @GetMapping
    public ResponseEntity<List<GroupDocument>> getMyGroups(@RequestParam String mobile) {
        if (mobile == null)
            return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(groupService.getMyGroups(mobile));
    }

    // Get group details
    @GetMapping("/{id}")
    public ResponseEntity<GroupDocument> getGroup(@PathVariable String id) {
        GroupDocument group = groupService.getGroup(id);
        if (group != null) {
            return ResponseEntity.ok(group);
        }
        return ResponseEntity.notFound().build();
    }
}
