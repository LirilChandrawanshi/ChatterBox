package com.example.ChatBot.util;

/**
 * Centralized input sanitizer for XSS prevention.
 * Replaces duplicated sanitize methods across controllers.
 */
public final class InputSanitizer {

    private InputSanitizer() {
        // utility class — no instantiation
    }

    /**
     * Escapes HTML special characters to prevent XSS attacks.
     *
     * @param input raw user input
     * @return sanitized string safe for rendering, or null if input is null
     */
    public static String sanitize(String input) {
        if (input == null)
            return null;
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;")
                .replace("/", "&#x2F;");
    }
}
