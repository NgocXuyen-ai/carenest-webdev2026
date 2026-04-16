package com.carenest.backend.dto.medicine;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MedicineOptionResponse {
    private Integer medicineId;
    private String medicineName;
    private Integer quantity;
    private String unit;
    private Integer cabinetId;
    private String cabinetName;
}
