package com.carenest.backend.dto.appointment;

import java.time.LocalDateTime;

import lombok.Getter;

@Getter
public class AppointmentDetailResponse {
    private Integer appointmentId;
    private Integer profileId;
    private String profileName;
    private String clinicName;
    private String doctorName;
    private LocalDateTime appointmentDate;
    private String location;
    private String note;
    private String status;
}
