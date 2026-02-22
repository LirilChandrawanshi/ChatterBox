package com.example.ChatBot.model;

import com.example.ChatBot.dto.chat.ChatMessageResponse;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * MongoDB document for persisting chat messages (CHAT and FILE types).
 * JOIN, LEAVE, TYPING are ephemeral and not stored.
 */
@Document(collection = "messages")
public class ChatMessageDocument {

    @Id
    private String id;

    @Indexed
    private String conversationId;

    private MessageType type;
    private String content;
    private String sender;
    private String fileContent;
    private String fileType;
    private long timestamp;

    // Reply-to-message fields
    private String replyToId;
    private String replyToContent;
    private String replyToSender;

    public ChatMessageDocument() {
    }

    public ChatMessageDocument(String conversationId, MessageType type, String content, String sender,
            String fileContent, String fileType, long timestamp) {
        this.conversationId = conversationId;
        this.type = type;
        this.content = content;
        this.sender = sender;
        this.fileContent = fileContent;
        this.fileType = fileType;
        this.timestamp = timestamp;
    }

    /**
     * Convert a ChatMessageResponse DTO into a persistable document.
     */
    public static ChatMessageDocument fromResponse(ChatMessageResponse response) {
        ChatMessageDocument doc = new ChatMessageDocument(
                response.getConversationId(),
                response.getType(),
                response.getContent(),
                response.getSender(),
                response.getFileContent(),
                response.getFileType(),
                response.getTimestamp());
        doc.setReplyToId(response.getReplyToId());
        doc.setReplyToContent(response.getReplyToContent());
        doc.setReplyToSender(response.getReplyToSender());
        return doc;
    }

    /**
     * Convert this document into a ChatMessageResponse DTO for API responses.
     */
    public ChatMessageResponse toResponse() {
        return ChatMessageResponse.builder()
                .id(id)
                .conversationId(conversationId)
                .type(type)
                .content(content)
                .sender(sender)
                .fileContent(fileContent)
                .fileType(fileType)
                .timestamp(timestamp)
                .replyToId(replyToId)
                .replyToContent(replyToContent)
                .replyToSender(replyToSender)
                .build();
    }

    // --- Getters & Setters ---

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public MessageType getType() {
        return type;
    }

    public void setType(MessageType type) {
        this.type = type;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getFileContent() {
        return fileContent;
    }

    public void setFileContent(String fileContent) {
        this.fileContent = fileContent;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }

    public String getReplyToId() {
        return replyToId;
    }

    public void setReplyToId(String replyToId) {
        this.replyToId = replyToId;
    }

    public String getReplyToContent() {
        return replyToContent;
    }

    public void setReplyToContent(String replyToContent) {
        this.replyToContent = replyToContent;
    }

    public String getReplyToSender() {
        return replyToSender;
    }

    public void setReplyToSender(String replyToSender) {
        this.replyToSender = replyToSender;
    }
}
