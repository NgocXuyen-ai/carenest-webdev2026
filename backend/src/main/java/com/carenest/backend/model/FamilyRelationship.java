package com.carenest.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

import com.carenest.backend.model.enums.FamilyRole;

@Entity
@Table(name = "family_relationship")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class FamilyRelationship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer famRelaId;

    @NotNull(message = "Profile không được để trống")
    @OneToOne
    @JoinColumn(name = "profile_id", nullable = false, unique = true)
    private HealthProfile profile;

    @NotNull(message = "Family không được để trống")
    @ManyToOne
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @NotNull(message = "Role không được để trống")
    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    private FamilyRole role;

    @Column(name = "join_at")
    private LocalDate joinAt;
}
