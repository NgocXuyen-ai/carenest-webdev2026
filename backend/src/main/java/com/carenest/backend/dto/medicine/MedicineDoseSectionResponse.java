package com.carenest.backend.dto.medicine;

import java.util.List;

import com.carenest.backend.model.enums.MedicineSession;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class MedicineDoseSectionResponse {
    private MedicineSession session;
    private String label;
    private List<MedicineDoseResponse> items;
}
