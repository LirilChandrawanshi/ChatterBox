package com.example.ChatBot.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * 1:1 conversation between two users (by mobile).
 * participant1 < participant2 lexicographically for unique lookup.
 */
@Document(collection = "conversations")
@CompoundIndex(name = "participants", def = "{'participant1': 1, 'participant2': 1}", unique = true)
public class ConversationDocument {

    @Id
    private String id;

    private String participant1; // smaller mobile
    private String participant2; // larger mobile
    private long createdAt;
    private long lastMessageAt;
    private String lastMessagePreview;

    public ConversationDocument() {
    }

    public ConversationDocument(String participant1, String participant2) {
        this.participant1 = participant1;
        this.participant2 = participant2;
        this.createdAt = System.currentTimeMillis();
        this.lastMessageAt = this.createdAt;
        this.lastMessagePreview = null;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getParticipant1() {
        return participant1;
    }

    public void setParticipant1(String participant1) {
        this.participant1 = participant1;
    }

    public String getParticipant2() {
        return participant2;
    }

    public void setParticipant2(String participant2) {
        this.participant2 = participant2;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }

    public long getLastMessageAt() {
        return lastMessageAt;
    }

    public void setLastMessageAt(long lastMessageAt) {
        this.lastMessageAt = lastMessageAt;
    }

    public String getLastMessagePreview() {
        return lastMessagePreview;
    }

    public void setLastMessagePreview(String lastMessagePreview) {
        this.lastMessagePreview = lastMessagePreview;
    }

    /** Returns the other participant's mobile given current user's mobile. */
    public String getOtherParticipant(String myMobile) {
        String m = myMobile != null ? UserDocument.normalizeMobile(myMobile) : null;
        if (m == null) return null;
        if (m.equals(participant1)) return participant2;
        if (m.equals(participant2)) return participant1;
        return null;
    }
}
