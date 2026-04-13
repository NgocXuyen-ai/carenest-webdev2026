package com.carenest.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "family_medicine_cabinet")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class FamilyMedicineCabinet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer cabinetId;

    @NotNull(message = "Family không được để trống")
    @ManyToOne
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @NotBlank(message = "Tên tủ thuốc không được để trống")
    @Size(max = 255, message = "Tên tủ thuốc tối đa 255 ký tự")
    @Column(name = "name", length = 255)
    private String name;

    @OneToMany(mappedBy = "cabinet")
    private List<DetailsMedicine> medicines = new ArrayList<>();
}
