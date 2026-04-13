package com.carenest.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointment")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer appointmentId;

    @NotNull(message = "Profile không được để trống")
    @ManyToOne
    @JoinColumn(name = "profile_id", nullable = false)
    private HealthProfile profile;

    @NotBlank(message = "Tên phòng khám không được để trống")
    @Size(max = 255, message = "Tên phòng khám tối đa 255 ký tự")
    @Column(name = "clinic_name", length = 255)
    private String clinicName;

    @NotBlank(message = "Tên bác sĩ không được để trống")
    @Size(max = 255, message = "Tên bác sĩ tối đa 255 ký tự")
    @Column(name = "doctor_name", length = 255)
    private String doctorName;

    @NotNull(message = "Ngày hẹn không được để trống")
    @FutureOrPresent(message = "Ngày hẹn phải là hiện tại hoặc tương lai")
    @Column(name = "appointment_date")
    private LocalDateTime appointmentDate;

    @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
    @Column(name = "location", length = 255)
    private String location;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @NotBlank(message = "Status không được để trống")
    @Size(max = 50, message = "Status tối đa 50 ký tự")
    @Column(name = "status", length = 50)
    private String status;
}
