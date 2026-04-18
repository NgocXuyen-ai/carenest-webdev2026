package com.carenest.backend.dto.growth;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class GrowthHistoryItem {
    private LocalDate date;
    private BigDecimal weight;
    private BigDecimal height;
    private String note;
}