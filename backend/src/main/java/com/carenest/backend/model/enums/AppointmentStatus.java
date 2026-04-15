package com.carenest.backend.model.enums;

public enum AppointmentStatus {
    SCHEDULED("Đã đặt lịch"),
    COMPLETED("Đã hoàn thành"),
    CANCELLED("Đã hủy"),
    MISSED("Bỏ lỡ");

    private final String displayName;

    AppointmentStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
