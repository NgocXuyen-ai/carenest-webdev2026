package com.carenest.backend.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.carenest.backend.service.NotificationGenerationService;

@Component

public class NotificationScheduler {

    private final NotificationGenerationService notificationGenerationService;
    
    public NotificationScheduler(NotificationGenerationService notificationGenerationService){
        this.notificationGenerationService = notificationGenerationService;
    }

    /**
     * Chạy mỗi 1 phút
     */
    @Scheduled(fixedRate = 10000)
    public void runNotificationJobs() {
        notificationGenerationService.generateMedicineNotifications();
        notificationGenerationService.generateAppointmentNotifications();
        notificationGenerationService.generateVaccinationNotifications();
    }
}
