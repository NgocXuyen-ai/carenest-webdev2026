package com.carenest.backend.dto.family;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class MyFamilyResponse {
    private Integer familyId;
    private String familyName;
    private Integer memberCount;
    private List<FamilyMemberItemResponse> members;
}
