package com.carenest.backend.model.enums;

public enum AiRequestStatus {
    PENDING("Đang chờ"),
    SUCCESS("Thành công"),
    FAILED("Thất bại");

    private final String displayName;

    AiRequestStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
