package com.example.ChatBot.controller;

import com.example.ChatBot.dto.chat.CreateGroupRequest;
import com.example.ChatBot.model.GroupDocument;
import com.example.ChatBot.service.GroupService;
import com.example.ChatBot.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashSet;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;
    private final UserService userService;

    public GroupController(GroupService groupService, UserService userService) {
        this.groupService = groupService;
        this.userService = userService;
    }

    /**
     * POST /api/groups
     * Create a new group.
     */
    @PostMapping
    public ResponseEntity<GroupDocument> createGroup(@RequestBody @Valid CreateGroupRequest request) {
        java.util.Set<String> members = new HashSet<>(
                request.getMembers() != null ? request.getMembers() : Collections.emptyList());

        GroupDocument group = groupService.createGroup(
                request.getName(), request.getDescription(), request.getAdminMobile(), members);
        return ResponseEntity.ok(group);
    }

    /**
     * GET /api/groups?mobile=xxx
     * Get groups for a user.
     */
    @GetMapping
    public ResponseEntity<List<GroupDocument>> getMyGroups(@RequestParam String mobile) {
        if (mobile == null)
            return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(groupService.getMyGroups(mobile));
    }

    /**
     * GET /api/groups/:id
     * Get group details.
     */
    @GetMapping("/{id}")
    public ResponseEntity<GroupDocument> getGroup(@PathVariable String id) {
        GroupDocument group = groupService.getGroup(id);
        if (group != null) {
            return ResponseEntity.ok(group);
        }
        return ResponseEntity.notFound().build();
    }
}
