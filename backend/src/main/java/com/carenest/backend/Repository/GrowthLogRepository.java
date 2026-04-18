package com.carenest.backend.repository;

import com.carenest.backend.model.GrowthLog;
import com.carenest.backend.model.HealthProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface GrowthLogRepository extends JpaRepository<GrowthLog, Integer> {
    List<GrowthLog> findByProfileOrderByRecordDateDesc(HealthProfile profile);
    List<GrowthLog> findByProfileOrderByRecordDateAsc(HealthProfile profile);
    boolean existsByProfileAndRecordDate(HealthProfile profile, LocalDate recordDate);
}