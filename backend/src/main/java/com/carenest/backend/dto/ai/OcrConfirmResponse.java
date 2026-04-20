package com.carenest.backend.dto.ai;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
public class OcrConfirmResponse {
    private Integer ocrId;
    @Builder.Default
    private List<Integer> medicineIds = new ArrayList<>();
    @Builder.Default
    private List<Integer> scheduleIds = new ArrayList<>();
}
