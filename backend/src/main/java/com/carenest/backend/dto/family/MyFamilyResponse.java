package com.carenest.backend.dto.family;

import java.util.List;

import com.carenest.backend.dto.profile.FamilyMemberSummaryResponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class MyFamilyResponse {
    private Integer familyId;
    private String familyName;
    private Integer ownerUserId;
    private Integer memberCount;
    private List<FamilyMemberSummaryResponse> members;
}
