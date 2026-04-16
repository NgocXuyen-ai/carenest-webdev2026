package com.carenest.backend.model.enums;

public enum ConversationStatus {
    ACTIVE("Đang hoạt động"),
    ARCHIVED("Đã lưu trữ"),
    CLOSED("Đã đóng");

    private final String displayName;

    ConversationStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}