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
public class AppointmentHistoryItemResponse {
    private Integer appointmentId;
    private String title;
    private LocalDateTime appointmentDate;
    private String displayDate;
    private String status;
}