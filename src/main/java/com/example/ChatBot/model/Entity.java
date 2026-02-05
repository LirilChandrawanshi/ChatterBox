package com.example.ChatBot.model;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

public class Entity {

    /** Set for persisted messages (CHAT/FILE); null for ephemeral messages. */
    private String id;

    /** Conversation id for 1:1 chats. */
    private String conversationId;

    @NotNull(message = "Message type is required")
    private MessageType type;

    @Size(max = 2000, message = "Content must not exceed 2000 characters")
    private String content;

    @NotBlank(message = "Sender is required")
    @Size(min = 1, max = 50, message = "Sender must be between 1 and 50 characters")
    private String sender;

    @Size(max = 10485760, message = "File content must not exceed 10MB (base64 encoded)")
    private String fileContent;

    @Size(max = 100, message = "File type must not exceed 100 characters")
    private String fileType;

    private long timestamp;

    /** For reply-to-message feature */
    private String replyToId;
    private String replyToContent;
    private String replyToSender;

    public enum MessageType {
        CHAT,
        JOIN,
        LEAVE,
        TYPING,
        FILE,
        READ,
        DELIVERED
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

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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