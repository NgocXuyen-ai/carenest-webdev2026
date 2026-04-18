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
@Table(name = "medicine_schedule")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MedicineSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer scheduleId;

    @NotNull(message = "Profile không được để trống")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private HealthProfile profile;

    @NotNull(message = "Medicine không được để trống")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id", nullable = false)
    private DetailsMedicine medicine;

    @NotBlank(message = "Tên thuốc không được để trống")
    @Size(max = 255, message = "Tên thuốc tối đa 255 ký tự")
    @Column(name = "medicine_name", length = 255, nullable = false)
    private String medicineName;

    @NotBlank(message = "Liều dùng không được để trống")
    @Size(max = 255, message = "Liều dùng tối đa 255 ký tự")
    @Column(name = "dosage", length = 255, nullable = false)
    private String dosage;

    @NotNull(message = "Tần suất không được để trống")
    @Min(value = 1, message = "Tần suất phải >= 1")
    @Column(name = "frequency", nullable = false)
    private Integer frequency;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "is_taken")
    private Boolean isTaken = false;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @OneToMany(mappedBy = "schedule", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MedicineDoseStatus> doseStatuses = new ArrayList<>();

    public void addDoseStatus(MedicineDoseStatus doseStatus) {
        this.doseStatuses.add(doseStatus);
        doseStatus.setSchedule(this);
    }
}