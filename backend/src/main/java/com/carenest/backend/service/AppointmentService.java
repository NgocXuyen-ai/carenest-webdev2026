package com.carenest.backend.service;

import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;

import com.carenest.backend.dto.appointment.AppointmentDetailResponse;
import com.carenest.backend.dto.appointment.AppointmentFormResponse;
import com.carenest.backend.dto.appointment.AppointmentHistoryItemResponse;
import com.carenest.backend.dto.appointment.AppointmentOverviewResponse;
import com.carenest.backend.dto.appointment.AppointmentResponse;
import com.carenest.backend.dto.appointment.CreateAppointmentRequest;
import com.carenest.backend.dto.appointment.UpcomingAppointmentResponse;
import com.carenest.backend.dto.appointment.UpdateAppointmentRequest;
import com.carenest.backend.dto.medicine.ProfileOptionResponse;
import com.carenest.backend.model.Appointment;
import com.carenest.backend.model.HealthProfile;
import com.carenest.backend.model.enums.AppointmentStatus;
import com.carenest.backend.repository.AppointmentRepository;
import com.carenest.backend.repository.HealthProfileRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class AppointmentService {
    public final AppointmentRepository appointmentRepository;
    public final HealthProfileRepository healthProfileRepository;

    public AppointmentService(
        AppointmentRepository appointmentRepository,
        HealthProfileRepository healthProfileRepository
    ){
        this.appointmentRepository = appointmentRepository;
        this.healthProfileRepository = healthProfileRepository;
    }

    public AppointmentDetailResponse createAppointment(CreateAppointmentRequest request) {
        HealthProfile profile = healthProfileRepository.findById(request.getProfileId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy profile với id: " + request.getProfileId()));

        Appointment appointment = new Appointment();
        appointment.setProfile(profile);
        appointment.setClinicName(request.getClinicName());
        appointment.setDoctorName(request.getDoctorName());
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setLocation(request.getLocation());
        appointment.setNote(request.getNote());

        // Khi create thì nên set mặc định, không cho client tự truyền status
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        Appointment savedAppointment = appointmentRepository.save(appointment);

        return AppointmentDetailResponse.builder()
                .appointmentId(savedAppointment.getAppointmentId())
                .profileId(profile.getProfile())
                .profileName(profile.getFullName())
                .clinicName(savedAppointment.getClinicName())
                .doctorName(savedAppointment.getDoctorName())
                .appointmentDate(savedAppointment.getAppointmentDate())
                .location(savedAppointment.getLocation())
                .note(savedAppointment.getNote())
                .status(savedAppointment.getStatus().name())
                .build();
    }

    public AppointmentOverviewResponse getOverview(Integer userId, Integer profileId) {
        LocalDateTime now = LocalDateTime.now();

        List<Appointment> upcoming = appointmentRepository
        .findByProfile_ProfileAndAppointmentDateGreaterThanEqualOrderByAppointmentDateAsc(
                profileId, now
        );
        List<Appointment> history = appointmentRepository
                .findByProfile_ProfileAndAppointmentDateLessThanOrderByAppointmentDateDesc(profileId, now);

        List<UpcomingAppointmentResponse> upcomingResponses = upcoming.stream()
                .map(this::mapToUpcomingResponse)
                .toList();

        List<AppointmentHistoryItemResponse> historyResponses = history.stream()
                .map(this::mapToHistoryResponse)
                .toList();

        return AppointmentOverviewResponse.builder()
                .upcomingCount(upcomingResponses.size())
                .upcomingAppointments(upcomingResponses)
                .appointmentHistory(historyResponses)
                .build();
    }

    public AppointmentFormResponse getFormData(Integer userId) {
        List<HealthProfile> profiles = healthProfileRepository.findByUserUserId(userId);

        List<ProfileOptionResponse> items = profiles.stream()
                .map(profile -> ProfileOptionResponse.builder()
                        .profileId(profile.getProfile())
                        .fullName(profile.getFullName())
                        .build())
                .toList();

        return AppointmentFormResponse.builder()
                .profiles(items)
                .build();
    }

    private UpcomingAppointmentResponse mapToUpcomingResponse(Appointment appointment) {
        LocalDateTime date = appointment.getAppointmentDate();

        return UpcomingAppointmentResponse.builder()
                .appointmentId(appointment.getAppointmentId())
                .title(appointment.getClinicName())
                .doctorName(appointment.getDoctorName())
                .appointmentDate(date)
                .location(appointment.getLocation())
                .status(appointment.getStatus().name())
                .dayOfWeek(formatDayOfWeek(date))
                .dayOfMonth(date.getDayOfMonth())
                .build();
    }

    private AppointmentHistoryItemResponse mapToHistoryResponse(Appointment appointment) {
        LocalDateTime date = appointment.getAppointmentDate();

        return AppointmentHistoryItemResponse.builder()
                .appointmentId(appointment.getAppointmentId())
                .title(appointment.getClinicName())
                .appointmentDate(date)
                .displayDate(formatDisplayDate(date))
                .status(appointment.getStatus().name())
                .build();
    }

    private String formatDayOfWeek(LocalDateTime dateTime) {
        return dateTime.getDayOfWeek()
        .getDisplayName(TextStyle.SHORT, Locale.of("vi", "VN"))
        .toUpperCase();
    }

    private String formatDisplayDate(LocalDateTime dateTime) {
        return String.format("%02d Tháng %d, %d - %02d:%02d",
                dateTime.getDayOfMonth(),
                dateTime.getMonthValue(),
                dateTime.getYear(),
                dateTime.getHour(),
                dateTime.getMinute());
    }

    public AppointmentResponse updateAppointment(Integer userId, Integer appointmentId, UpdateAppointmentRequest request) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cuộc hẹn"));
    
        HealthProfile profile = healthProfileRepository.findById(request.getProfileId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy profile"));
    
        if (AppointmentStatus.CANCELLED.equals(appointment.getStatus())) {
            throw new IllegalStateException("Cuộc hẹn đã bị hủy, không thể cập nhật");
        }
    
        appointment.setProfile(profile);
        appointment.setClinicName(request.getClinicName());
        appointment.setDoctorName(request.getDoctorName());
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setLocation(request.getLocation());
        appointment.setNote(request.getNote());
    
        Appointment saved = appointmentRepository.save(appointment);
    
        return mapToResponse(saved);
    }

    public AppointmentResponse cancelAppointment(Integer userId, Integer appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cuộc hẹn"));

        if (AppointmentStatus.CANCELLED.equals(appointment.getStatus())) {
            throw new IllegalStateException("Cuộc hẹn đã được hủy trước đó");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);

        Appointment saved = appointmentRepository.save(appointment);

        return mapToResponse(saved);
    }

    private AppointmentResponse mapToResponse(Appointment appointment) {
        return AppointmentResponse.builder()
                .appointmentId(appointment.getAppointmentId())
                .profileId(appointment.getProfile().getProfile())
                .profileName(appointment.getProfile().getFullName())
                .profileAvatarUrl(appointment.getProfile().getAvatarUrl())
                .clinicName(appointment.getClinicName())
                .doctorName(appointment.getDoctorName())
                .appointmentDate(appointment.getAppointmentDate())
                .location(appointment.getLocation())
                .note(appointment.getNote())
                .status(appointment.getStatus().name())
                .build();
    }
}
