package com.carenest.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

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

    @NotBlank(message = "Status không được để trống")
    @Size(max = 50, message = "Status tối đa 50 ký tự")
    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
