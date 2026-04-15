package com.carenest.backend.model.enums;

public enum OcrSessionStatus {
    PENDING("Đang chờ"),
    PROCESSING("Đang xử lý"),
    COMPLETED("Hoàn thành"),
    FAILED("Thất bại");

    private final String displayName;

    OcrSessionStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
