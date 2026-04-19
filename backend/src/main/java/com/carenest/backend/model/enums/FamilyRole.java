package com.carenest.backend.model.enums;

public enum FamilyRole {
    OWNER("Chủ gia đình"),
    FATHER("Bố"),
    MOTHER("Mẹ"),

    OLDER_BROTHER("Anh"),
    OLDER_SISTER("Chị"),
    YOUNGER("Em"),

    OTHER("Người thân");

    private final String displayName;

    FamilyRole(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}