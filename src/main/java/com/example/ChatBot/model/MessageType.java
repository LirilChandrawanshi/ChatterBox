package com.example.ChatBot.model;

/**
 * All message types used in the chat system.
 * Extracted as a top-level enum for cleaner cross-layer usage.
 */
public enum MessageType {
    CHAT,
    JOIN,
    LEAVE,
    TYPING,
    FILE,
    READ,
    DELIVERED
}
