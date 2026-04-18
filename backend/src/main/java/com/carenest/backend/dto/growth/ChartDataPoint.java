package com.carenest.backend.dto.growth;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class ChartDataPoint {
    private String label; // Ví dụ: "Tháng 1", "Tháng 6"
    private BigDecimal value;
}