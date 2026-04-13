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

@Entity
@Table(name = "vaccination")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Vaccination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer vaccineLogId;

    @NotNull(message = "Profile không được để trống")
    @ManyToOne
    @JoinColumn(name = "profile_id", nullable = false)
    private HealthProfile profile;

    @NotBlank(message = "Tên vaccine không được để trống")
    @Size(max = 255, message = "Tên vaccine tối đa 255 ký tự")
    @Column(name = "vaccine_name", length = 255)
    private String vaccineName;

    @NotNull(message = "Số mũi không được để trống")
    @Min(value = 1, message = "Số mũi phải >= 1")
    @Column(name = "dose_number")
    private Integer doseNumber;

    @Column(name = "date_given")
    private LocalDate dateGiven;

    @Column(name = "planned_date")
    private LocalDate plannedDate;

    @Size(max = 255, message = "Tên phòng khám tối đa 255 ký tự")
    @Column(name = "clinic_name", length = 255)
    private String clinicName;

    @NotBlank(message = "Status không được để trống")
    @Size(max = 50, message = "Status tối đa 50 ký tự")
    @Column(name = "status", length = 50)
    private String status;
}
