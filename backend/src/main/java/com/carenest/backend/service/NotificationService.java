package com.carenest.backend.service;

import com.carenest.backend.dto.notification.NotificationResponse;
import com.carenest.backend.model.Notification;
import com.carenest.backend.repository.NotificationRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository){
        this.notificationRepository = notificationRepository;
    }

    public List<com.carenest.backend.dto.notification.NotificationResponse> getNotifications(Integer profileId, Boolean isRead) {
        Sort sort = Sort.by(Sort.Direction.DESC, "scheduledTime");

        List<Notification> notifications;
        if (isRead == null) {
            notifications = notificationRepository.findByProfile_Profile(profileId, sort);
        } else {
            notifications = notificationRepository.findByProfile_ProfileAndIsRead(profileId, isRead, sort);
        }

        return notifications.stream()
                .map(this::mapToResponse)
                .toList();
    }

    public void markAsRead(Integer notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy notification với id = " + notificationId));

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    private com.carenest.backend.dto.notification.NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
            .notificationId(notification.getNotificationId())
            .type(notification.getType())
            .title(notification.getTitle())
            .content(notification.getContent())
            .scheduledTime(notification.getScheduledTime())
            .isRead(notification.getIsRead())
            .referenceId(notification.getReferenceId())
            .build();
    }
}
