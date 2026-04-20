package com.carenest.backend.service;

import com.carenest.backend.dto.family.MyFamilyResponse;
import com.carenest.backend.dto.notification.NotificationResponse;
import com.carenest.backend.model.HealthProfile;
import com.carenest.backend.repository.HealthProfileRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiContextService {

    private final FamilyService familyService;
    private final MedicineService medicineService;
    private final AppointmentService appointmentService;
    private final VaccinationService vaccinationService;
    private final GrowthService growthService;
    private final NotificationService notificationService;
    private final HealthProfileRepository healthProfileRepository;
    private final ProfileAccessService profileAccessService;

    public AiContextService(FamilyService familyService,
                            MedicineService medicineService,
                            AppointmentService appointmentService,
                            VaccinationService vaccinationService,
                            GrowthService growthService,
                            NotificationService notificationService,
                            HealthProfileRepository healthProfileRepository,
                            ProfileAccessService profileAccessService) {
        this.familyService = familyService;
        this.medicineService = medicineService;
        this.appointmentService = appointmentService;
        this.vaccinationService = vaccinationService;
        this.growthService = growthService;
        this.notificationService = notificationService;
        this.healthProfileRepository = healthProfileRepository;
        this.profileAccessService = profileAccessService;
    }

    public Map<String, Object> buildContext(Integer userId, Integer requestedProfileId) {
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("currentDate", LocalDate.now().toString());

        List<HealthProfile> accessibleProfiles = profileAccessService.getAccessibleProfiles(userId);
        boolean familyAggregate = requestedProfileId == null && accessibleProfiles.size() > 1;

        HealthProfile selectedProfile = null;
        if (!familyAggregate) {
            Integer effectiveProfileId = requestedProfileId != null
                    ? profileAccessService.requireAccessibleProfile(userId, requestedProfileId).getProfile()
                    : accessibleProfiles.getFirst().getProfile();
            selectedProfile = healthProfileRepository.findById(effectiveProfileId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ được chọn"));
        }

        Map<String, Object> familyData = null;
        try {
            MyFamilyResponse family = familyService.getMyFamily(userId);
            familyData = new LinkedHashMap<>();
            familyData.put("familyId", family.getFamilyId());
            familyData.put("familyName", family.getFamilyName());
            familyData.put("memberCount", family.getMemberCount());
            familyData.put("members", family.getMembers());
        } catch (RuntimeException ignored) {
        }

        List<Map<String, Object>> profileContexts = new ArrayList<>();
        for (HealthProfile profile : accessibleProfiles) {
            Integer profileId = profile.getProfile();
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("profile", mapProfile(profile));
            item.put("dailyMedicine", safeExecute(() -> medicineService.getDailySchedule(profileId, LocalDate.now(), userId)));
            item.put("appointments", safeExecute(() -> appointmentService.getOverview(userId, profileId)));
            item.put("vaccinations", safeExecute(() -> vaccinationService.getTrackerData(userId, profileId)));
            item.put("growth", safeExecute(() -> growthService.getGrowthSummary(userId, profileId)));
            profileContexts.add(item);
        }

        List<NotificationResponse> unreadNotifications = loadUnreadNotifications(userId, accessibleProfiles, selectedProfile, familyAggregate);

        context.put("family", familyData);
        context.put("scopeType", familyAggregate ? "FAMILY" : "PROFILE");
        context.put("selectedProfileId", selectedProfile != null ? selectedProfile.getProfile() : null);
        context.put("selectedProfile", selectedProfile != null ? mapProfile(selectedProfile) : null);
        context.put("profiles", profileContexts);
        context.put("medicineCabinet", safeExecute(() -> medicineService.getMyMedicines(userId)));
        context.put("unreadNotifications", unreadNotifications);
        context.put("unreadNotificationCount", unreadNotifications.size());
        return context;
    }

    public Map<String, Object> buildAiRoutingContext(Integer userId, Integer requestedProfileId) {
        Map<String, Object> fullContext = buildContext(userId, requestedProfileId);
        Map<String, Object> compactContext = new LinkedHashMap<>();
        compactContext.put("currentDate", fullContext.get("currentDate"));
        compactContext.put("scopeType", fullContext.get("scopeType"));
        compactContext.put("selectedProfileId", fullContext.get("selectedProfileId"));
        compactContext.put("selectedProfile", fullContext.get("selectedProfile"));
        compactContext.put("family", fullContext.get("family"));
        compactContext.put("unreadNotificationCount", fullContext.get("unreadNotificationCount"));
        compactContext.put("profiles", fullContext.get("profiles"));
        return compactContext;
    }

    private List<NotificationResponse> loadUnreadNotifications(Integer userId,
                                                               List<HealthProfile> accessibleProfiles,
                                                               HealthProfile selectedProfile,
                                                               boolean familyAggregate) {
        if (familyAggregate) {
            return accessibleProfiles.stream()
                    .flatMap(profile -> notificationService.getNotifications(userId, profile.getProfile(), false).stream())
                    .sorted(Comparator.comparing(NotificationResponse::getScheduledTime,
                            Comparator.nullsLast(Comparator.reverseOrder())))
                    .toList();
        }

        if (selectedProfile == null) {
            return List.of();
        }

        return notificationService.getNotifications(userId, selectedProfile.getProfile(), false);
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

