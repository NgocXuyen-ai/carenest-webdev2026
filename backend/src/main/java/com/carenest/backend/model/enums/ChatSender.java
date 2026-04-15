package com.carenest.backend.model.enums;

public enum ChatSender {
    USER("Người dùng"),
    AI("AI"),
    SYSTEM("Hệ thống");

    private final String displayName;

    ChatSender(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
