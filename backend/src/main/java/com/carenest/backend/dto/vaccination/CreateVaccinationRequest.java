package com.carenest.backend.dto.vaccination;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class CreateVaccinationRequest {
    @NotBlank(message = "Tên vaccine không được để trống")
    @Size(max = 255, message = "Tên vaccine tối đa 255 ký tự")
    private String vaccineName;

    @NotNull(message = "Số mũi không được để trống")
    @Min(value = 1, message = "Số mũi phải >= 1")
    private Integer doseNumber;

    private LocalDate dateGiven;

    private LocalDate plannedDate;

    @Size(max = 255, message = "Tên phòng khám tối đa 255 ký tự")
    private String clinicName;
}