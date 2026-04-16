package com.carenest.backend.model.enums;

public enum VaccinationStatus {
    PLANNED("Dự kiến"),
    DONE("Đã tiêm"),
    MISSED("Bỏ lỡ"),
    CANCELLED("Đã hủy");

    private final String displayName;

    VaccinationStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}