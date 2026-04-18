package com.carenest.backend.dto.medicine;

import java.time.LocalDate;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class MedicineResponse {
    private Integer medicineId;
    private String name;
    private Integer quantity;
    private String unit;
    private LocalDate expiryDate;
    private String status;
}
