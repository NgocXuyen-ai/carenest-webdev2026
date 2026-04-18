package com.carenest.backend.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.carenest.backend.model.enums.MedicineSession;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "medicine_dose_status")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MedicineDoseStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer doseId;

    @NotNull(message = "Schedule không được để trống")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    private MedicineSchedule schedule;

    @NotNull(message = "Ngày uống không được để trống")
    @Column(name = "dose_date", nullable = false)
    private LocalDate doseDate;

    @NotNull(message = "Session không được để trống")
    @Enumerated(EnumType.STRING)
    @Column(name = "session", nullable = false)
    private MedicineSession session;

    @Column(name = "is_taken")
    private Boolean isTaken = false;

    @Column(name = "taken_at")
    private LocalDateTime takenAt;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;
}