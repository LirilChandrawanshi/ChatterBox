package com.example.ChatBot.controller;

import com.example.ChatBot.model.CommunityPostDocument;
import com.example.ChatBot.model.UserDocument;
import com.example.ChatBot.repository.CommunityPostRepository;
import com.example.ChatBot.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/community")
public class CommunityController {

    private final CommunityPostRepository postRepository;
    private final UserService userService;

    public CommunityController(CommunityPostRepository postRepository, UserService userService) {
        this.postRepository = postRepository;
        this.userService = userService;
    }

    /**
     * POST /api/community?mobile=xxx
     * Create a new community post.
     */
    @PostMapping
    public ResponseEntity<CommunityPostDocument> createPost(
            @RequestParam String mobile,
            @RequestBody Map<String, String> body) {

        String content = body.get("content");
        String imageBase64 = body.get("imageBase64");
        String imageType = body.get("imageType");

        if ((content == null || content.isBlank()) && (imageBase64 == null || imageBase64.isBlank())) {
            return ResponseEntity.badRequest().build();
        }

        UserDocument user = userService.findByMobile(mobile);
        String userName = user != null && user.getDisplayName() != null ? user.getDisplayName() : mobile;

        CommunityPostDocument post = new CommunityPostDocument(mobile, userName, content);
        if (imageBase64 != null && !imageBase64.isBlank()) {
            post.setImageBase64(imageBase64);
            post.setImageType(imageType);
        }

        CommunityPostDocument saved = postRepository.save(post);
        return ResponseEntity.ok(saved);
    }

    /**
     * GET /api/community
     * Get all community posts (newest first).
     */
    @GetMapping
    public ResponseEntity<List<CommunityPostDocument>> getAllPosts() {
        List<CommunityPostDocument> posts = postRepository.findAllByOrderByCreatedAtDesc();
        return ResponseEntity.ok(posts);
    }

    /**
     * POST /api/community/:id/like?mobile=xxx
     * Toggle like on a post.
     */
    @PostMapping("/{id}/like")
    public ResponseEntity<CommunityPostDocument> toggleLike(
            @PathVariable String id,
            @RequestParam String mobile) {

        Optional<CommunityPostDocument> opt = postRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        CommunityPostDocument post = opt.get();
        post.toggleLike(mobile);
        CommunityPostDocument saved = postRepository.save(post);
        return ResponseEntity.ok(saved);
    }

    /**
     * POST /api/community/:id/comment?mobile=xxx
     * Add a comment to a post.
     */
    @PostMapping("/{id}/comment")
    public ResponseEntity<CommunityPostDocument> addComment(
            @PathVariable String id,
            @RequestParam String mobile,
            @RequestBody Map<String, String> body) {

        String content = body.get("content");
        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        Optional<CommunityPostDocument> opt = postRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        UserDocument user = userService.findByMobile(mobile);
        String userName = user != null && user.getDisplayName() != null ? user.getDisplayName() : mobile;

        CommunityPostDocument post = opt.get();
        CommunityPostDocument.Comment comment = new CommunityPostDocument.Comment(mobile, userName, content);
        post.addComment(comment);

        CommunityPostDocument saved = postRepository.save(post);
        return ResponseEntity.ok(saved);
    }

    /**
     * DELETE /api/community/:id?mobile=xxx
     * Delete my post.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable String id, @RequestParam String mobile) {
        Optional<CommunityPostDocument> opt = postRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        CommunityPostDocument post = opt.get();
        if (!post.getAuthorMobile().equals(mobile)) {
            return ResponseEntity.status(403).build();
        }

        postRepository.delete(post);
        return ResponseEntity.ok().build();
    }
}
