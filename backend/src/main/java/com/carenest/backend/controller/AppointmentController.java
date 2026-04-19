package com.carenest.backend.controller;

import com.carenest.backend.dto.appointment.AppointmentDetailResponse;
import com.carenest.backend.dto.appointment.AppointmentFormResponse;
import com.carenest.backend.dto.appointment.AppointmentOverviewResponse;
import com.carenest.backend.dto.appointment.AppointmentResponse;
import com.carenest.backend.dto.appointment.CreateAppointmentRequest;
import com.carenest.backend.dto.appointment.UpdateAppointmentRequest;
import com.carenest.backend.helper.ApiResponse;
import com.carenest.backend.security.CustomUserDetails;
import com.carenest.backend.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/appointments")
public class AppointmentController {
    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping("/create-appointment")
    public ResponseEntity<ApiResponse<AppointmentDetailResponse>> createAppointment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateAppointmentRequest request
    ) {
        if (userDetails == null) {
            throw new RuntimeException("Bạn chưa đăng nhập");
        }

        AppointmentDetailResponse response = appointmentService.createAppointment(userDetails.getId(), request);
        return ApiResponse.success(response, "Tạo cuộc hẹn với bác sĩ thành công");
    }

    @GetMapping("/appointment/overview/{profileId}")
    public ResponseEntity<ApiResponse<AppointmentOverviewResponse>> getOverview(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer profileId
    ) {
        if (userDetails == null) {
            throw new RuntimeException("Bạn chưa đăng nhập");
        }

        AppointmentOverviewResponse data = appointmentService.getOverview(userDetails.getId(), profileId);
        return ApiResponse.success(data, "Lấy danh sách lịch khám thành công");
    }

    @GetMapping("/form-data")
    public ResponseEntity<ApiResponse<AppointmentFormResponse>> getFormData(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new RuntimeException("Bạn chưa đăng nhập");
        }

        AppointmentFormResponse data = appointmentService.getFormData(userDetails.getId());
        return ApiResponse.success(data, "Lấy dữ liệu form thành công");
    }

    @PutMapping("/appointment/{appointmentId}")
    public ResponseEntity<ApiResponse<AppointmentResponse>> updateAppointment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer appointmentId,
            @Valid @RequestBody UpdateAppointmentRequest request
    ) {
        if (userDetails == null) {
            throw new RuntimeException("Bạn chưa đăng nhập");
        }

        AppointmentResponse data = appointmentService.updateAppointment(userDetails.getId(), appointmentId, request);
        return ApiResponse.success(data, "Cập nhật lịch khám thành công");
    }

    @PatchMapping("/{appointmentId}/cancel")
    public ResponseEntity<ApiResponse<AppointmentResponse>> cancelAppointment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer appointmentId
    ) {
        if (userDetails == null) {
            throw new RuntimeException("Bạn chưa đăng nhập");
        }

        AppointmentResponse data = appointmentService.cancelAppointment(userDetails.getId(), appointmentId);
        return ApiResponse.success(data, "Hủy lịch hẹn thành công");
    }
}

