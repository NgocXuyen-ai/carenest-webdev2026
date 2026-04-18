package com.carenest.backend.dto.appointment;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CreateAppointmentRequest {
    @NotNull(message = "Profile id không được để trống")
    private Integer profileId;

    @NotBlank(message = "Tên phòng khám không được để trống")
    @Size(max = 255, message = "Tên phòng khám tối đa 255 ký tự")
    private String clinicName;

    @NotBlank(message = "Tên bác sĩ không được để trống")
    @Size(max = 255, message = "Tên bác sĩ tối đa 255 ký tự")
    private String doctorName;

    @NotNull(message = "Ngày hẹn không được để trống")
    @FutureOrPresent(message = "Ngày hẹn phải là hiện tại hoặc tương lai")
    private LocalDateTime appointmentDate;

    @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
    private String location;

    @Size(max = 2000, message = "Ghi chú tối đa 2000 ký tự")
    private String note;
}