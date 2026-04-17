package com.carenest.backend.dto.medicine;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

import com.carenest.backend.model.enums.MedicineSession;

@Getter
@Setter
@Builder
public class MedicineScheduleResponse {

    private Integer scheduleId;
    private String profileName;
    private String medicineName;
    private String dosage;
    private Integer frequency;
    private List<MedicineSession> sessions;
    private String note;
    private LocalDate startDate;
    private LocalDate endDate;
}