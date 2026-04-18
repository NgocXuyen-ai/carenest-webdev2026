package com.carenest.backend.dto.vaccination;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class VaccinationTrackerResponse {
    private String stageLabel; // VD: "Sơ sinh", "2 tháng tuổi"
    private String description; // VD: "Giai đoạn đầu tiên...", "Sắp tới 3 mũi..."
    private List<VaccinationResponse> vaccinations;
}