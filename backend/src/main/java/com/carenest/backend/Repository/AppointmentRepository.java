package com.carenest.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.carenest.backend.model.Appointment;
import com.carenest.backend.model.enums.AppointmentStatus;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {
    List<Appointment> findByProfile_Profile(Integer profileId);

    List<Appointment> findByProfile_ProfileAndAppointmentDateBetween(
        Integer profileId,
        LocalDateTime from,
        LocalDateTime to
    );

    List<Appointment> findByAppointmentDateBetween(
        LocalDateTime from,
        LocalDateTime to
    );

    List<Appointment> findByProfile_ProfileAndAppointmentDateGreaterThanEqualOrderByAppointmentDateAsc(
        Integer profileId,
        LocalDateTime now
    );

    List<Appointment> findByProfile_ProfileAndAppointmentDateLessThanOrderByAppointmentDateDesc(
        Integer profileId,
        LocalDateTime now
    );

    List<Appointment> findByAppointmentDateBetweenAndStatus(
        LocalDateTime start,
        LocalDateTime end,
        AppointmentStatus status
    );

}
