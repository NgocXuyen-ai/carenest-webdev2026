package com.carenest.backend.service;

import com.carenest.backend.model.Appointment;
import com.carenest.backend.model.MedicineDoseStatus;
import com.carenest.backend.model.MedicineSchedule;
import com.carenest.backend.model.Notification;
import com.carenest.backend.model.Vaccination;
import com.carenest.backend.model.enums.VaccinationStatus;
import com.carenest.backend.model.enums.MedicineSession;
import com.carenest.backend.model.enums.NotificationType;
import com.carenest.backend.repository.AppointmentRepository;
import com.carenest.backend.repository.MedicineDoseStatusRepository;
import com.carenest.backend.repository.NotificationRepository;
import com.carenest.backend.repository.VaccinationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationGenerationService {

    private final NotificationRepository notificationRepository;
    private final MedicineDoseStatusRepository medicineDoseStatusRepository;
    private final AppointmentRepository appointmentRepository;
    private final VaccinationRepository vaccinationRepository;

    /**
     * Generate notification thuốc trong 5 phút tới.
     * Có thể gọi từ scheduler hoặc gọi tạm từ controller để test.
     */
    @Transactional
    public void generateMedicineNotifications() {
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime next5Minutes = now.plusMinutes(5);

        List<MedicineDoseStatus> doses = medicineDoseStatusRepository.findByDoseDateAndIsTakenFalse(today);

        for (MedicineDoseStatus dose : doses) {
            LocalDateTime scheduledTime = LocalDateTime.of(
                    dose.getDoseDate(),
                    mapSessionToTime(dose.getSession())
            );

            if (!scheduledTime.isBefore(now) && !scheduledTime.isAfter(next5Minutes)) {
                if (!notificationRepository.existsByTypeAndReferenceIdAndScheduledTime(
                        NotificationType.MEDICINE,
                        dose.getDoseId(),
                        scheduledTime
                )) {
                    Notification notification = new Notification();
                    notification.setProfile(dose.getSchedule().getProfile());
                    notification.setReferenceId(dose.getDoseId());
                    notification.setType(NotificationType.MEDICINE);
                    notification.setTitle("Đến giờ uống thuốc");
                    notification.setContent(buildMedicineContent(dose));
                    notification.setScheduledTime(scheduledTime);
                    notification.setIsRead(false);

                    notificationRepository.save(notification);
                }
            }
        }
    }

    /**
     * Generate notification lịch hẹn trong 1 giờ tới.
     */
    @Transactional
    public void generateAppointmentNotifications() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime next1Hour = now.plusHours(1);

        List<Appointment> appointments = appointmentRepository
                .findByAppointmentDateBetweenAndStatus(
                        now,
                        next1Hour,
                        com.carenest.backend.model.enums.AppointmentStatus.SCHEDULED
                );

        for (Appointment appointment : appointments) {
            LocalDateTime scheduledTime = appointment.getAppointmentDate();

            if (!notificationRepository.existsByTypeAndReferenceIdAndScheduledTime(
                    NotificationType.APPOINTMENT,
                    appointment.getAppointmentId(),
                    scheduledTime
            )) {
                Notification notification = new Notification();
                notification.setProfile(appointment.getProfile());
                notification.setReferenceId(appointment.getAppointmentId());
                notification.setType(NotificationType.APPOINTMENT);
                notification.setTitle("Nhắc lịch hẹn khám");
                notification.setContent(buildAppointmentContent(appointment));
                notification.setScheduledTime(scheduledTime);
                notification.setIsRead(false);

                notificationRepository.save(notification);
            }
        }
    }

    /**
     * Generate notification vaccine trong 3 ngày tới.
     */
    @Transactional
    public void generateVaccinationNotifications() {
        LocalDate today = LocalDate.now();
        LocalDate next3Days = today.plusDays(3);

        List<Vaccination> vaccinations = vaccinationRepository
                .findByPlannedDateBetweenAndStatus(
                        today,
                        next3Days,
                VaccinationStatus.PLANNED
                );

        for (Vaccination vaccination : vaccinations) {
            LocalDateTime scheduledTime = vaccination.getPlannedDate().atStartOfDay();

            if (!notificationRepository.existsByTypeAndReferenceIdAndScheduledTime(
                    NotificationType.VACCINATION,
                    vaccination.getVaccineLogId(),
                    scheduledTime
            )) {
                Notification notification = new Notification();
                notification.setProfile(vaccination.getProfile());
                notification.setReferenceId(vaccination.getVaccineLogId());
                notification.setType(NotificationType.VACCINATION);
                notification.setTitle("Nhắc lịch tiêm chủng");
                notification.setContent(buildVaccinationContent(vaccination));
                notification.setScheduledTime(scheduledTime);
                notification.setIsRead(false);

                notificationRepository.save(notification);
            }
        }
    }

    private LocalTime mapSessionToTime(MedicineSession session) {
        return switch (session) {
            case MORNING -> LocalTime.of(8, 0);
            case NOON -> LocalTime.of(12, 0);
            case EVENING -> LocalTime.of(20, 0);
        };
    }

    private String buildMedicineContent(MedicineDoseStatus dose) {
        MedicineSchedule schedule = dose.getSchedule();
        return String.format(
                "%s - %s (%s)",
                schedule.getMedicineName(),
                schedule.getDosage(),
                dose.getSession().name()
        );
    }

    private String buildAppointmentContent(Appointment appointment) {
        return String.format(
                "Bạn có lịch hẹn với bác sĩ %s tại %s",
                appointment.getDoctorName(),
                appointment.getClinicName()
        );
    }

    private String buildVaccinationContent(Vaccination vaccination) {
        return String.format(
                "Đến lịch tiêm %s - mũi %d",
                vaccination.getVaccineName(),
                vaccination.getDoseNumber()
        );
    }
}