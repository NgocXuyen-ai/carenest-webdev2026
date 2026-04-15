package com.carenest.backend.model.enums;

public enum ChatMessageType {
    TEXT("Văn bản"),
    IMAGE("Hình ảnh"),
    OCR("OCR"),
    SUGGESTION("Gợi ý");

    private final String displayName;

    ChatMessageType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
