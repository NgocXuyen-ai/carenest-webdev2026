package com.carenest.backend.dto.growth;

import lombok.Data;
import java.util.List;

@Data
public class GrowthSummaryResponse {
    private String childName;
    private String ageString; 
    private String statusLabel; // "Bình thường"
    
    // Ràng buộc 5 lần đo
    private boolean canDrawChart; 
    private String chartMessage; // Thông báo nếu chưa đủ 5 lần đo
    
    private List<ChartDataPoint> weightChart;
    private List<ChartDataPoint> heightChart;
    private List<GrowthHistoryItem> history;
}