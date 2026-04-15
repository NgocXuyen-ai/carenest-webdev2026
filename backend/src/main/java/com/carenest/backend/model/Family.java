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
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "family")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Family {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer familyId;

    @NotBlank(message = "Tên family không được để trống")
    @Size(max = 255, message = "Tên family tối đa 255 ký tự")
    @Column(name = "name", length = 255)
    private String name;

    @NotNull(message = "Owner không được để trống")
    @OneToOne
    @JoinColumn(name = "owner", nullable = false)
    private User owner;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @OneToMany(mappedBy = "family")
    private List<FamilyInvitation> invitations = new ArrayList<>();

    @OneToMany(mappedBy = "family")
    private List<FamilyRelationship> relationships = new ArrayList<>();

    @OneToMany(mappedBy = "family")
    private List<FamilyMedicineCabinet> medicineCabinets = new ArrayList<>();
}
