package com.carenest.backend.service;

import com.carenest.backend.dto.notification.NotificationResponse;
import com.carenest.backend.repository.HealthProfileRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final AiContextService aiContextService;
    private final HealthProfileRepository healthProfileRepository;
    private final NotificationService notificationService;

    public DashboardService(AiContextService aiContextService,
                            HealthProfileRepository healthProfileRepository,
                            NotificationService notificationService) {
        this.aiContextService = aiContextService;
        this.healthProfileRepository = healthProfileRepository;
        this.notificationService = notificationService;
    }

    public Map<String, Object> getDashboard(Integer userId, Integer profileId) {
        Map<String, Object> context = aiContextService.buildContext(userId, profileId);
        Integer selectedProfileId = (Integer) context.get("selectedProfileId");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> profiles = (List<Map<String, Object>>) context.getOrDefault("profiles", new ArrayList<>());
        Map<String, Object> selectedProfile = profiles.stream()
                .map(item -> (Map<String, Object>) item.get("profile"))
                .filter(item -> item != null && selectedProfileId.equals(item.get("profileId")))
                .findFirst()
                .orElseGet(() -> {
                    Map<String, Object> fallback = new LinkedHashMap<>();
                    healthProfileRepository.findById(selectedProfileId).ifPresent(profile -> {
                        fallback.put("profileId", profile.getProfile());
                        fallback.put("fullName", profile.getFullName());
                        fallback.put("avatarUrl", profile.getAvatarUrl());
                    });
                    return fallback;
                });

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> familyProfiles = profiles;
        List<NotificationResponse> unreadNotifications = notificationService.getNotifications(selectedProfileId, false);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("generatedAt", LocalDate.now().toString());
        response.put("family", context.get("family"));
        response.put("selectedProfileId", selectedProfileId);
        response.put("selectedProfile", selectedProfile);
        response.put("profiles", familyProfiles);
        response.put("medicineCabinet", context.get("medicineCabinet"));
        response.put("profileContexts", familyProfiles);
        response.put("notifications", unreadNotifications);
        response.put("unreadNotificationCount", unreadNotifications.size());
        response.put("aiSummary", buildAiSummary(familyProfiles, unreadNotifications.size()));
        return response;
    }

    private String buildAiSummary(List<Map<String, Object>> profiles, int unreadNotificationCount) {
        int trackedProfiles = profiles.size();
        if (trackedProfiles == 0) {
            return "Hôm nay chưa có đủ dữ liệu để tạo tóm tắt sức khỏe.";
        }

        if (unreadNotificationCount > 0) {
            return "Hôm nay gia đình có " + unreadNotificationCount + " nhắc nhở cần kiểm tra. Ưu tiên xem thuốc trong ngày và lịch hẹn sắp tới.";
        }

        return "Hôm nay chưa có cảnh báo lớn. Bạn có thể kiểm tra lịch thuốc, lịch khám và hỏi CareNest AI nếu cần tra cứu nhanh.";
    }
}
