package com.carenest.backend.dto.medicine;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MedicineDoseResponse {
    private Integer doseId;
    private String medicineName;
    private String dosage;
    private String note;
    private Boolean isTaken;
}
