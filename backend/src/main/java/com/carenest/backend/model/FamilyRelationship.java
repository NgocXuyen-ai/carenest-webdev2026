package com.carenest.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

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

    @NotBlank(message = "Role không được để trống")
    @Size(max = 100, message = "Role tối đa 100 ký tự")
    @Column(name = "role", length = 100)
    private String role;

    @Column(name = "join_at")
    private LocalDate joinAt;
}
