package com.carenest.backend.service;

import com.carenest.backend.dto.family.MyFamilyResponse;
import com.carenest.backend.dto.notification.NotificationResponse;
import com.carenest.backend.dto.profile.ProfileDetailsResponse;
import com.carenest.backend.model.HealthProfile;
import com.carenest.backend.repository.HealthProfileRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AiContextService {

    private final FamilyService familyService;
    private final MedicineService medicineService;
    private final AppointmentService appointmentService;
    private final VaccinationService vaccinationService;
    private final GrowthService growthService;
    private final NotificationService notificationService;
    private final HealthProfileRepository healthProfileRepository;

    public AiContextService(FamilyService familyService,
                            MedicineService medicineService,
                            AppointmentService appointmentService,
                            VaccinationService vaccinationService,
                            GrowthService growthService,
                            NotificationService notificationService,
                            HealthProfileRepository healthProfileRepository) {
        this.familyService = familyService;
        this.medicineService = medicineService;
        this.appointmentService = appointmentService;
        this.vaccinationService = vaccinationService;
        this.growthService = growthService;
        this.notificationService = notificationService;
        this.healthProfileRepository = healthProfileRepository;
    }

    public Map<String, Object> buildContext(Integer userId, Integer requestedProfileId) {
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("currentDate", LocalDate.now().toString());

            HealthProfile ownProfile = healthProfileRepository.findFirstByUser_UserIdOrderByProfileAsc(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ sức khỏe của người dùng"));

        Set<Integer> accessibleProfileIds = new LinkedHashSet<>();
        Map<String, Object> familyData = null;

        try {
            MyFamilyResponse family = familyService.getMyFamily(userId);
            familyData = new LinkedHashMap<>();
            familyData.put("familyId", family.getFamilyId());
            familyData.put("familyName", family.getFamilyName());
            familyData.put("memberCount", family.getMemberCount());
            familyData.put("members", family.getMembers());
            family.getMembers().forEach(member -> accessibleProfileIds.add(member.getProfileId()));
        } catch (RuntimeException ignored) {
            accessibleProfileIds.add(ownProfile.getProfile());
        }

        if (accessibleProfileIds.isEmpty()) {
            accessibleProfileIds.add(ownProfile.getProfile());
        }

        Integer selectedProfileId = requestedProfileId != null && accessibleProfileIds.contains(requestedProfileId)
                ? requestedProfileId
                : accessibleProfileIds.iterator().next();

        List<Map<String, Object>> profileContexts = new ArrayList<>();
        for (Integer profileId : accessibleProfileIds) {
            Map<String, Object> item = new LinkedHashMap<>();
            HealthProfile profile = healthProfileRepository.findById(profileId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy profile với id = " + profileId));

            item.put("profile", mapProfile(profile));
            item.put("dailyMedicine", safeExecute(() -> medicineService.getDailySchedule(profileId, LocalDate.now(), userId)));
            item.put("appointments", safeExecute(() -> appointmentService.getOverview(userId, profileId)));
            item.put("vaccinations", safeExecute(() -> vaccinationService.getTrackerData(profileId)));
            item.put("growth", safeExecute(() -> growthService.getGrowthSummary(profileId)));
            profileContexts.add(item);
        }

        List<NotificationResponse> unreadNotifications =
                safeExecute(() -> notificationService.getNotifications(selectedProfileId, false));

        context.put("family", familyData);
        context.put("selectedProfileId", selectedProfileId);
        context.put("selectedProfile", mapProfile(
                healthProfileRepository.findById(selectedProfileId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy profile được chọn"))
        ));
        context.put("profiles", profileContexts);
        context.put("medicineCabinet", safeExecute(() -> medicineService.getMyMedicines(userId)));
        context.put("unreadNotifications", unreadNotifications);
        context.put("unreadNotificationCount", unreadNotifications != null ? unreadNotifications.size() : 0);
        return context;
    }

    private Map<String, Object> mapProfile(HealthProfile profile) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("profileId", profile.getProfile());
        data.put("fullName", profile.getFullName());
        data.put("birthday", profile.getBirthday());
        data.put("gender", profile.getGender());
        data.put("bloodType", profile.getBloodType());
        data.put("medicalHistory", profile.getMedicalHistory());
        data.put("allergy", profile.getAllergy());
        data.put("height", profile.getHeight());
        data.put("weight", profile.getWeight());
        data.put("avatarUrl", profile.getAvatarUrl());
        data.put("emergencyContactPhone", profile.getEmergencyContactPhone());
        return data;
    }

    private <T> T safeExecute(UnsafeSupplier<T> supplier) {
        try {
            return supplier.get();
        } catch (Exception ignored) {
            return null;
        }
    }

    @FunctionalInterface
    private interface UnsafeSupplier<T> {
        T get();
    }
}
