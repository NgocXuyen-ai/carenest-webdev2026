package com.carenest.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
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
@Table(name = "details_medicine")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class DetailsMedicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer medicineId;

    @NotNull(message = "Cabinet không được để trống")
    @ManyToOne
    @JoinColumn(name = "cabinet_id", nullable = false)
    private FamilyMedicineCabinet cabinet;

    @NotBlank(message = "Tên thuốc không được để trống")
    @Size(max = 255, message = "Tên thuốc tối đa 255 ký tự")
    @Column(name = "name", length = 255)
    private String name;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 0, message = "Số lượng phải >= 0")
    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @OneToMany(mappedBy = "medicine")
    private List<MedicineSchedule> schedules = new ArrayList<>();
}
