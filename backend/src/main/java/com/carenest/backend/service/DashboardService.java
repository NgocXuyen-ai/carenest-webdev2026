package com.carenest.backend.service;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final AiContextService aiContextService;

    public DashboardService(AiContextService aiContextService) {
        this.aiContextService = aiContextService;
    }

    public Map<String, Object> getDashboard(Integer userId, Integer profileId) {
        Map<String, Object> context = aiContextService.buildContext(userId, profileId);
        String scopeType = (String) context.getOrDefault("scopeType", "PROFILE");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> profileContexts = (List<Map<String, Object>>) context.getOrDefault("profiles", new ArrayList<>());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("generatedAt", LocalDate.now().toString());
        response.put("scopeType", scopeType);
        response.put("family", context.get("family"));
        response.put("selectedProfileId", context.get("selectedProfileId"));
        response.put("selectedProfile", context.get("selectedProfile"));
        response.put("profiles", profileContexts);
        response.put("medicineCabinet", context.get("medicineCabinet"));
        response.put("profileContexts", profileContexts);
        response.put("notifications", context.get("unreadNotifications"));
        response.put("unreadNotificationCount", context.get("unreadNotificationCount"));
        response.put("aiSummary", buildAiSummary(scopeType, profileContexts, ((Number) context.getOrDefault("unreadNotificationCount", 0)).intValue()));
        return response;
    }

    private String buildAiSummary(String scopeType, List<Map<String, Object>> profiles, int unreadNotificationCount) {
        int trackedProfiles = profiles.size();
        if (trackedProfiles == 0) {
            return "Hôm nay chưa có đủ dữ liệu để tạo tóm tắt sức khỏe.";
        }

        if (unreadNotificationCount > 0) {
            return "Hôm nay có " + unreadNotificationCount + " nhắc nhở cần kiểm tra. Ưu tiên xem thuốc trong ngày và lịch hẹn sắp tới.";
        }

        if ("FAMILY".equals(scopeType)) {
            return "Chế độ Cả nhà đang tổng hợp sức khỏe của toàn bộ thành viên. Bạn có thể xem nhắc nhở, lịch khám và hỏi CareNest AI để tra cứu nhanh.";
        }

        return "Hôm nay chưa có cảnh báo lớn. Bạn có thể kiểm tra lịch thuốc, lịch khám và hỏi CareNest AI nếu cần tra cứu nhanh.";
    }
}
