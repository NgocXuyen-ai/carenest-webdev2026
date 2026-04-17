package com.carenest.backend.dto.profile;

import com.carenest.backend.model.enums.FamilyRole;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class FamilyMemberSummaryResponse {
    private Integer profileId;
    private String fullName;
    private FamilyRole role;
    private String avatarUrl;
    private Integer age;
    private String healthStatus;
}
