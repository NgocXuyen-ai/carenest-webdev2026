package com.carenest.backend.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.carenest.backend.model.MedicineDoseStatus;
@Repository
public interface MedicineDoseStatusRepository extends JpaRepository<MedicineDoseStatus, Integer> {

    Optional<MedicineDoseStatus> findBySchedule_ScheduleIdAndDoseDateAndSession(
            Integer schedule,
            LocalDate doseDate,
            String session
    );

    List<MedicineDoseStatus> findBySchedule_Profile_ProfileAndDoseDate(
            Integer profileId,
            LocalDate doseDate
    );

    @Query("""
        select d
        from MedicineDoseStatus d
        join fetch d.schedule s
        join fetch s.profile p
        where p.profile = :profileId
          and d.doseDate = :doseDate
        order by d.session asc, d.doseId asc
    """)
    List<MedicineDoseStatus> findDailyDoseStatuses(Integer profileId, LocalDate doseDate);
    void deleteBySchedule_ScheduleId(Integer scheduleId);
}
