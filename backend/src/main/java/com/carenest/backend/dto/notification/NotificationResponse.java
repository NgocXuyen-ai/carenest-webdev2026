package com.carenest.backend.dto.notification;

import java.time.LocalDateTime;

import com.carenest.backend.model.enums.NotificationType;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationResponse {
    private Integer notificationId;
    private NotificationType type;
    private String title;
    private String content;
    private LocalDateTime scheduledTime;
    private Boolean isRead;
    private Integer referenceId;
}
