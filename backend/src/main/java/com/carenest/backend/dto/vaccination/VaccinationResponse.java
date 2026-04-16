package com.carenest.backend.dto.vaccination;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Builder
public class VaccinationResponse {

    private Integer vaccineLogId;

    private Integer profileId;
    private String fullName;

    private String vaccineName;
    private Integer doseNumber;

    private LocalDate dateGiven;
    private LocalDate plannedDate;

    private String clinicName;

    private String status;
}