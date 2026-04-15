package com.carenest.backend.model.enums;

public enum NotificationType {
    APPOINTMENT("Lịch khám"),
    MEDICINE("Nhắc uống thuốc"),
    VACCINATION("Tiêm chủng"),
    FAMILY_INVITATION("Lời mời gia đình"),
    SYSTEM("Hệ thống");

    private final String displayName;

    NotificationType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
