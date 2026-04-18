package com.carenest.backend.dto.medicine;

import java.util.List;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class MedicineCabinetResponse {
    private Integer cabinetId;
    private String cabinetName;
    private List<MedicineResponse> medicines;
}
