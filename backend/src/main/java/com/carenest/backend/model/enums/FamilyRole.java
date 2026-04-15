package com.carenest.backend.model.enums;

public enum FamilyRole {
    OWNER("Chủ gia đình"),
    MEMBER("Thành viên");

    private final String displayName;

    FamilyRole(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}