package com.carenest.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

import com.carenest.backend.model.enums.FamilyRole;
import com.carenest.backend.model.enums.InvitationStatus;

@Entity
@Table(name = "family_invitation")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class FamilyInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer inviteId;

    @NotNull(message = "Receiver không được để trống")
    @ManyToOne
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @NotNull(message = "Family không được để trống")
    @ManyToOne
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private InvitationStatus status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "role")
    private FamilyRole role;

    @NotNull(message = "Sender không được để trống")
    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;
}
