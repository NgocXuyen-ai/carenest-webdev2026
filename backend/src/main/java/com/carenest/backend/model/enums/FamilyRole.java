package com.carenest.backend.model.enums;

public enum FamilyRole {
    OWNER("Chủ gia đình"),
    MEMBER("Thành viên"),
    FATHER("Bo"),
    MOTHER("Me"),
    OLDER_BROTHER("Anh"),
    OLDER_SISTER("Chi"),
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
