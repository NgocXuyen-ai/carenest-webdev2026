package com.carenest.backend.dto.family;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyInvitationResponse {
    private Integer inviteId;
    private Integer familyId;
    private String familyName;
    private Integer senderId;
    private String senderEmail;
    private Integer receiverId;
    private String receiverEmail;
    private String status;
    private String message;
}
