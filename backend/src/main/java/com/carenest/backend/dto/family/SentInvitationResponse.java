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
public class SentInvitationResponse {
    private Integer inviteId;
    private Integer familyId;
    private String familyName;
    private Integer receiverId;
    private String receiverEmail;
    private String status;
    private LocalDateTime createdAt;
}
