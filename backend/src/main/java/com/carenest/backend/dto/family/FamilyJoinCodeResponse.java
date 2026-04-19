package com.carenest.backend.dto.family;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class FamilyJoinCodeResponse {
    private String joinCode;
    private String joinLink;
    private String qrCodeBase64;
    private LocalDateTime expiresAt;
    private Integer familyId;
    private String familyName;
}
