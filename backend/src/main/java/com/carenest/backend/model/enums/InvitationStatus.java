package com.carenest.backend.model.enums;

public enum InvitationStatus {
    PENDING("Đang chờ"),
    ACCEPTED("Đã chấp nhận"),
    REJECTED("Đã từ chối"),
    CANCELLED("Đã hủy");

    private final String displayName;

    InvitationStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
