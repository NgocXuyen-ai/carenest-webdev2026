package com.carenest.backend.dto.medicine;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class ProfileOptionResponse {
    private Integer profileId;
    private String fullName;
}
