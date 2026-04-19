package com.carenest.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.carenest.backend.model.Notification;
import com.carenest.backend.model.enums.NotificationType;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    List<Notification> findByProfile_Profile(Integer profileId, Sort sort);
    List<Notification> findByProfile_ProfileIn(List<Integer> profileIds, Sort sort);

    List<Notification> findByProfile_ProfileAndIsRead(Integer profileId, Boolean isRead, Sort sort);
    List<Notification> findByProfile_ProfileInAndIsRead(List<Integer> profileIds, Boolean isRead, Sort sort);

    long countByProfile_ProfileAndIsRead(Integer profileId, Boolean isRead);

    boolean existsByTypeAndReferenceId(NotificationType type, Integer referenceId);
    boolean existsByTypeAndReferenceIdAndScheduledTime(
            NotificationType type,
            Integer referenceId,
            LocalDateTime scheduledTime
    );
}
