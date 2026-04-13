package com.carenest.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "medicine_schedule")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class MedicineSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer scheduleId;

    @NotNull(message = "Profile không được để trống")
    @ManyToOne
    @JoinColumn(name = "profile_id", nullable = false)
    private HealthProfile profile;

    @NotNull(message = "Medicine không được để trống")
    @ManyToOne
    @JoinColumn(name = "medicine_id", nullable = false)
    private DetailsMedicine medicine;

    @NotBlank(message = "Tên thuốc không được để trống")
    @Size(max = 255, message = "Tên thuốc tối đa 255 ký tự")
    @Column(name = "medicine_name", length = 255)
    private String medicineName;

    @NotBlank(message = "Liều dùng không được để trống")
    @Size(max = 255, message = "Liều dùng tối đa 255 ký tự")
    @Column(name = "dosage", length = 255)
    private String dosage;

    @NotNull(message = "Tần suất không được để trống")
    @Min(value = 1, message = "Tần suất phải >= 1")
    @Column(name = "frequency")
    private Integer frequency;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "is_taken")
    private Boolean isTaken = false;

    @PastOrPresent(message = "Ngày bắt đầu không hợp lệ")
    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;
}
