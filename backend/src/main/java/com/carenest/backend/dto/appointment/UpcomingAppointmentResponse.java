package com.carenest.backend.dto.appointment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpcomingAppointmentResponse {
    private Integer appointmentId;
    private String title;
    private String doctorName;
    private LocalDateTime appointmentDate;
    private String location;
    private String status;

    private String dayOfWeek;
    private Integer dayOfMonth;
}