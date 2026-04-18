package com.carenest.backend.dto.medicine;

import java.time.LocalDate;
import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class DailyMedicineScheduleResponse {
    private String profileName;
    private LocalDate date;
    private List<MedicineDoseSectionResponse> sections;
}
