package com.carenest.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

import com.carenest.backend.model.enums.NotificationType;

@Entity
@Table(name = "notifications")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer notificationId;

    @NotNull(message = "Profile không được để trống")
    @ManyToOne
    @JoinColumn(name = "profile_id", nullable = false)
    private HealthProfile profile;

    @Column(name = "reference_id")
    private Integer referenceId;

    @NotNull(message = "Type không được để trống")
    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private NotificationType type;

    @NotBlank(message = "Title không được để trống")
    @Size(max = 255, message = "Title tối đa 255 ký tự")
    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "scheduled_time")
    private LocalDateTime scheduledTime;

    @Column(name = "is_read")
    private Boolean isRead = false;
}
