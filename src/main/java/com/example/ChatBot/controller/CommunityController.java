package com.example.ChatBot.controller;

import com.example.ChatBot.dto.community.AddCommentRequest;
import com.example.ChatBot.dto.community.CommunityPostResponse;
import com.example.ChatBot.dto.community.CreatePostRequest;
import com.example.ChatBot.model.CommunityPostDocument;
import com.example.ChatBot.model.UserDocument;
import com.example.ChatBot.repository.CommunityPostRepository;
import com.example.ChatBot.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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
    public ResponseEntity<CommunityPostResponse> createPost(
            @RequestParam String mobile,
            @Valid @RequestBody CreatePostRequest request) {

        if ((request.getContent() == null || request.getContent().isBlank())
                && (request.getImageBase64() == null || request.getImageBase64().isBlank())) {
            return ResponseEntity.badRequest().build();
        }

        UserDocument user = userService.findByMobile(mobile);
        String userName = user != null && user.getDisplayName() != null ? user.getDisplayName() : mobile;

        CommunityPostDocument post = new CommunityPostDocument(mobile, userName, request.getContent());
        if (request.getImageBase64() != null && !request.getImageBase64().isBlank()) {
            post.setImageBase64(request.getImageBase64());
            post.setImageType(request.getImageType());
        }

        CommunityPostDocument saved = postRepository.save(post);
        return ResponseEntity.ok(CommunityPostResponse.from(saved));
    }

    /**
     * GET /api/community
     * Get all community posts (newest first).
     */
    @GetMapping
    public ResponseEntity<List<CommunityPostResponse>> getAllPosts() {
        List<CommunityPostResponse> posts = postRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(CommunityPostResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(posts);
    }

    /**
     * POST /api/community/:id/like?mobile=xxx
     * Toggle like on a post.
     */
    @PostMapping("/{id}/like")
    public ResponseEntity<CommunityPostResponse> toggleLike(
            @PathVariable String id,
            @RequestParam String mobile) {

        Optional<CommunityPostDocument> opt = postRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        CommunityPostDocument post = opt.get();
        post.toggleLike(mobile);
        CommunityPostDocument saved = postRepository.save(post);
        return ResponseEntity.ok(CommunityPostResponse.from(saved));
    }

    /**
     * POST /api/community/:id/comment?mobile=xxx
     * Add a comment to a post.
     */
    @PostMapping("/{id}/comment")
    public ResponseEntity<CommunityPostResponse> addComment(
            @PathVariable String id,
            @RequestParam String mobile,
            @Valid @RequestBody AddCommentRequest request) {

        Optional<CommunityPostDocument> opt = postRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        UserDocument user = userService.findByMobile(mobile);
        String userName = user != null && user.getDisplayName() != null ? user.getDisplayName() : mobile;

        CommunityPostDocument post = opt.get();
        CommunityPostDocument.Comment comment = new CommunityPostDocument.Comment(mobile, userName,
                request.getContent());
        post.addComment(comment);

        CommunityPostDocument saved = postRepository.save(post);
        return ResponseEntity.ok(CommunityPostResponse.from(saved));
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
