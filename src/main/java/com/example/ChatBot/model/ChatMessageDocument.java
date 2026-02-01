package com.example.ChatBot.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * MongoDB document for persisting chat messages (CHAT and FILE types).
 * JOIN, LEAVE, TYPING are ephemeral and not stored.
 */
@Document(collection = "messages")
public class ChatMessageDocument {

    @Id
    private String id;

    private Entity.MessageType type;
    private String content;
    private String sender;
    private String fileContent;
    private String fileType;
    private long timestamp;

    public ChatMessageDocument() {
    }

    public ChatMessageDocument(Entity.MessageType type, String content, String sender,
                               String fileContent, String fileType, long timestamp) {
        this.type = type;
        this.content = content;
        this.sender = sender;
        this.fileContent = fileContent;
        this.fileType = fileType;
        this.timestamp = timestamp;
    }

    public static ChatMessageDocument fromEntity(Entity entity) {
        return new ChatMessageDocument(
                entity.getType(),
                entity.getContent(),
                entity.getSender(),
                entity.getFileContent(),
                entity.getFileType(),
                entity.getTimestamp()
        );
    }

    public Entity toEntity() {
        Entity entity = new Entity();
        entity.setType(type);
        entity.setContent(content);
        entity.setSender(sender);
        entity.setFileContent(fileContent);
        entity.setFileType(fileType);
        entity.setTimestamp(timestamp);
        return entity;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Entity.MessageType getType() {
        return type;
    }

    public void setType(Entity.MessageType type) {
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
}
