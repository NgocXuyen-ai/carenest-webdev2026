package com.carenest.backend.dto.appointment;

import com.fasterxml.jackson.annotation.JsonFormat;
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
public class AppointmentResponse {

    private Integer appointmentId;
    private Integer profileId;
    private String profileName;
    private String profileAvatarUrl;
    private String clinicName;
    private String doctorName;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime appointmentDate;

    private String location;
    private String note;

    private String status;
}