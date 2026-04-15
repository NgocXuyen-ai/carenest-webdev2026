package com.carenest.backend.model.enums;

public enum AiFeatureType {
    CHAT("Chat"),
    OCR("OCR"),
    SUMMARY("Tóm tắt"),
    HEALTH_ANALYSIS("Phân tích sức khỏe"),
    RECOMMENDATION("Gợi ý");

    private final String displayName;

    AiFeatureType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
