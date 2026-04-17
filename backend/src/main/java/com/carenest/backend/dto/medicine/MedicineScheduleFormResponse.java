package com.carenest.backend.dto.medicine;

import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MedicineScheduleFormResponse {
    private List<ProfileOptionResponse> profiles;
    private List<MedicineOptionResponse> medicines;
}
