package com.carenest.backend.dto.appointment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentOverviewResponse {
    private Integer upcomingCount;
    private List<UpcomingAppointmentResponse> upcomingAppointments;
    private List<AppointmentHistoryItemResponse> appointmentHistory;
}