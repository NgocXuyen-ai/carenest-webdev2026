package com.carenest.backend.dto.family;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceivedInvitationResponse {
    private Integer inviteId;
    private Integer familyId;
    private String familyName;
    private Integer senderId;
    private String senderEmail;
    private String status;
    private LocalDateTime createdAt;
}