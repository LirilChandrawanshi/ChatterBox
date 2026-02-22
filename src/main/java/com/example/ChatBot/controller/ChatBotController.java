package com.example.ChatBot.controller;

import com.example.ChatBot.dto.chat.ChatMessageRequest;
import com.example.ChatBot.dto.chat.ChatMessageResponse;
import com.example.ChatBot.dto.chat.FileMessageRequest;
import com.example.ChatBot.dto.chat.ReadReceiptRequest;
import com.example.ChatBot.dto.chat.TypingRequest;
import com.example.ChatBot.dto.chat.UserJoinRequest;
import com.example.ChatBot.model.MessageType;
import com.example.ChatBot.service.ChatService;
import com.example.ChatBot.service.ConversationService;
import com.example.ChatBot.util.InputSanitizer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import javax.validation.Valid;

@Slf4j
@Controller
public class ChatBotController {

    private final ChatService chatService;
    private final ConversationService conversationService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatBotController(ChatService chatService, ConversationService conversationService,
            SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.conversationService = conversationService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessageResponse sendMessage(@Payload @Valid ChatMessageRequest request) {
        log.info("Received message from {}: {}", request.getSender(), request.getContent());

        ChatMessageResponse response = ChatMessageResponse.builder()
                .type(request.getType())
                .content(InputSanitizer.sanitize(request.getContent()))
                .sender(request.getSender())
                .conversationId(request.getConversationId())
                .timestamp(System.currentTimeMillis())
                .replyToId(request.getReplyToId())
                .replyToContent(request.getReplyToContent())
                .replyToSender(request.getReplyToSender())
                .build();

        String savedId = chatService.saveIfPersistable(response);
        if (savedId != null) {
            response.setId(savedId);
        }
        return response;
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessageResponse addUser(@Payload @Valid UserJoinRequest request,
            SimpMessageHeaderAccessor headerAccessor) {
        log.info("User joined: {}", request.getSender());

        var sessionAttributes = headerAccessor.getSessionAttributes();
        if (sessionAttributes != null) {
            sessionAttributes.put("username", request.getSender());
        }

        return ChatMessageResponse.builder()
                .type(request.getType())
                .sender(request.getSender())
                .timestamp(System.currentTimeMillis())
                .build();
    }

    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload @Valid TypingRequest request) {
        log.debug("User typing: {} in conversation: {}", request.getSender(), request.getConversationId());

        ChatMessageResponse response = ChatMessageResponse.builder()
                .type(MessageType.TYPING)
                .sender(request.getSender())
                .conversationId(request.getConversationId())
                .timestamp(System.currentTimeMillis())
                .build();

        if (request.getConversationId() != null) {
            String convId = request.getConversationId();
            String sender = request.getSender();

            conversationService.listForUser(sender).stream()
                    .filter(c -> c.getId().equals(convId))
                    .findFirst()
                    .ifPresent(conv -> {
                        String otherMobile = conv.getOtherParticipant(sender);
                        messagingTemplate.convertAndSendToUser(otherMobile, "/queue/messages", response);
                    });
        } else {
            messagingTemplate.convertAndSend("/topic/public", response);
        }
    }

    @MessageMapping("/chat.read")
    public void handleReadReceipt(@Payload @Valid ReadReceiptRequest request) {
        log.debug("Read receipt from: {} in conversation: {}", request.getSender(), request.getConversationId());

        String convId = request.getConversationId();
        String sender = request.getSender();

        var updatedConv = conversationService.markAsRead(convId, sender);
        if (updatedConv == null)
            return;

        String otherMobile = updatedConv.getOtherParticipant(sender);
        if (otherMobile != null) {
            ChatMessageResponse response = ChatMessageResponse.builder()
                    .type(MessageType.READ)
                    .sender(sender)
                    .conversationId(convId)
                    .timestamp(System.currentTimeMillis())
                    .build();
            messagingTemplate.convertAndSendToUser(otherMobile, "/queue/messages", response);
        }
    }

    @MessageMapping("/chat.sendFile")
    @SendTo("/topic/public")
    public ChatMessageResponse sendFile(@Payload @Valid FileMessageRequest request) {
        log.info("File shared by {}: {}", request.getSender(), request.getFileType());

        ChatMessageResponse response = ChatMessageResponse.builder()
                .type(request.getType())
                .sender(request.getSender())
                .conversationId(request.getConversationId())
                .fileContent(request.getFileContent())
                .fileType(request.getFileType())
                .timestamp(System.currentTimeMillis())
                .build();

        String savedId = chatService.saveIfPersistable(response);
        if (savedId != null) {
            response.setId(savedId);
        }
        return response;
    }
}