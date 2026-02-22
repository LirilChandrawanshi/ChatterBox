/**
 * Utility to format user identifiers for display.
 * Converts "google_user@gmail.com" → "user@gmail.com"
 * Returns the original value for regular mobile numbers.
 */
export function formatUserIdentifier(mobile: string): string {
    if (!mobile) return "";
    if (mobile.startsWith("google_")) {
        return mobile.slice(7); // Remove "google_" prefix → show clean email
    }
    return mobile;
}

/**
 * Check if a user identifier belongs to a Google OAuth user.
 */
export function isGoogleUser(mobile: string): boolean {
    return !!mobile && mobile.startsWith("google_");
}
