package com.example.ChatBot.model;

import java.util.List;

/** Broadcast to clients when messages are deleted so they can remove them from UI. */
public class MessagesDeletedEvent {

    public static final String TYPE = "DELETED";

    private final String type = TYPE;
    private List<String> messageIds;

    public MessagesDeletedEvent() {
    }

    public MessagesDeletedEvent(List<String> messageIds) {
        this.messageIds = messageIds;
    }

    public String getType() {
        return type;
    }

    public List<String> getMessageIds() {
        return messageIds;
    }

    public void setMessageIds(List<String> messageIds) {
        this.messageIds = messageIds;
    }
}
