package com.carenest.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.carenest.backend.dto.notification.NotificationResponse;
import com.carenest.backend.helper.ApiResponse;
import com.carenest.backend.service.NotificationGenerationService;
import com.carenest.backend.service.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationGenerationService notificationGenerationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotifications(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam Integer profileId,
            @RequestParam(required = false) Boolean isRead) {

        List<NotificationResponse> notifications =
                this.notificationService.getNotifications(profileId, isRead);

        return ApiResponse.success(notifications, "Lấy danh sách notification thành công");
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<String>> markAsRead(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Integer notificationId) {

        this.notificationService.markAsRead(notificationId);

        return ApiResponse.success("OK", "Đánh dấu đã đọc thành công");
    }

    @PostMapping("/generate/medicine")
    public ResponseEntity<ApiResponse<String>> generateMedicineNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {

        this.notificationGenerationService.generateMedicineNotifications();

        return ApiResponse.success("OK", "Tạo notification thuốc thành công");
    }

    @PostMapping("/generate/appointment")
    public ResponseEntity<ApiResponse<String>> generateAppointmentNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {

        this.notificationGenerationService.generateAppointmentNotifications();

        return ApiResponse.success("OK", "Tạo notification lịch hẹn thành công");
    }

    @PostMapping("/generate/vaccination")
    public ResponseEntity<ApiResponse<String>> generateVaccinationNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {

        this.notificationGenerationService.generateVaccinationNotifications();

        return ApiResponse.success("OK", "Tạo notification tiêm chủng thành công");
    }
}
