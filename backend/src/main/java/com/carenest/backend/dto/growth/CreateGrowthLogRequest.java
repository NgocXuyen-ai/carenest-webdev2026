package com.carenest.backend.dto.growth;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateGrowthLogRequest {
    @NotNull(message = "Profile ID không được để trống")
    private Integer profileId;
    
    private BigDecimal weight;
    private BigDecimal height;
    
    @NotNull(message = "Ngày ghi nhận không được để trống")
    private LocalDate recordDate;
    
    private String note;
}