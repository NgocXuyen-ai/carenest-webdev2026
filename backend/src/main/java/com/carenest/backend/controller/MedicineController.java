package com.carenest.backend.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carenest.backend.dto.medicine.CreateMedicineRequest;
import com.carenest.backend.dto.medicine.CreateMedicineScheduleRequest;
import com.carenest.backend.dto.medicine.DailyMedicineScheduleResponse;
import com.carenest.backend.dto.medicine.MedicineResponse;
import com.carenest.backend.dto.medicine.MedicineScheduleFormResponse;
import com.carenest.backend.dto.medicine.MedicineScheduleResponse;
import com.carenest.backend.dto.medicine.TakeMedicineDoseRequest;
import com.carenest.backend.helper.ApiResponse;
import com.carenest.backend.security.CustomUserDetails;
import com.carenest.backend.service.MedicineService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/medicine")
public class MedicineController {
    private final MedicineService medicineService;

    public MedicineController(
        MedicineService medicineService
    ){
        this.medicineService = medicineService;
    }

    @GetMapping("/schedules/form-data")
    public ResponseEntity<ApiResponse<MedicineScheduleFormResponse>> getFormData(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new RuntimeException("Bạn chưa đăng nhập");
        }

        MedicineScheduleFormResponse data =
                medicineService.getFormData(userDetails.getId());

        return ApiResponse.success(data, "Lấy dữ liệu form thành công");
    }

    @PostMapping("/schedules")
    public ResponseEntity<ApiResponse<Void>> createMedicineSchedule(
            @Valid @RequestBody CreateMedicineScheduleRequest request
    ) {
        medicineService.createMedicineSchedule(request);
        return ApiResponse.success(null, "Tạo lịch uống thuốc thành công");
    }

    @GetMapping("/medicine-schedules/{profileId}")
    public ResponseEntity<ApiResponse<List<MedicineScheduleResponse>>> getMedicineSchedules(
            @PathVariable Integer profileId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new RuntimeException("Bạn chưa đăng nhập");
        }

        List<MedicineScheduleResponse> data =
        medicineService.getMedicineSchedules(profileId);

        return ApiResponse.success(data, "Lấy danh sách lịch uống thuốc thành công");
    }

    @PostMapping("/cabinet/create-medicine")
    public ResponseEntity<ApiResponse<Void>> createMedicine(
            @Valid @RequestBody CreateMedicineRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new RuntimeException("Bạn chưa đăng nhập");
        }

        medicineService.createMedicine(userDetails.getId(), request);
        return ApiResponse.success(null, "Thêm thuốc thành công");
    }

    @DeleteMapping("/{medicineId}")
    public ResponseEntity<ApiResponse<Void>> deleteMedicine(
            @PathVariable Integer medicineId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new RuntimeException("Bạn chưa đăng nhập");
        }

        medicineService.deleteMedicine(userDetails.getId(), medicineId);
        return ApiResponse.success(null, "Xóa thuốc thành công");
    }

    @GetMapping("/{medicineId}")
    public ResponseEntity<ApiResponse<MedicineResponse>> getMedicineDetail(
            @PathVariable Integer medicineId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new RuntimeException("Bạn chưa đăng nhập");
        }

        MedicineResponse data = medicineService.getMedicineDetail(userDetails.getId(), medicineId);
        return ApiResponse.success(data, "Lấy chi tiết thuốc thành công");
    }

    @GetMapping("/cabinet")
    public ResponseEntity<ApiResponse<List<MedicineResponse>>> getMyMedicines(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new RuntimeException("Bạn chưa đăng nhập");
        }

        List<MedicineResponse> data = medicineService.getMyMedicines(userDetails.getId());
        return ApiResponse.success(data, "Lấy danh sách thuốc thành công");
    }

    

    @GetMapping("/medicine-schedules/{profileId}/daily")
    public ResponseEntity<ApiResponse<DailyMedicineScheduleResponse>> getDailySchedule(
            @PathVariable Integer profileId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new RuntimeException("Bạn chưa đăng nhập");
        }
        DailyMedicineScheduleResponse data =
                medicineService.getDailySchedule(profileId, date, userDetails.getId());
        return ApiResponse.success(data, "Lấy lịch theo ngày thành công");
    }

    @PostMapping("/medicine-schedules/take-dose")
    public ResponseEntity<ApiResponse<Void>> takeDose(
            @Valid @RequestBody TakeMedicineDoseRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new RuntimeException("Bạn chưa đăng nhập");
        }

        medicineService.takeDose(request, userDetails.getId());
        return ApiResponse.success(null, "Đã cập nhật trạng thái uống thuốc");
    }

    @DeleteMapping("/medicine-schedules/{scheduleId}")
    public ResponseEntity<ApiResponse<Void>> deleteMedicineSchedule(
            @PathVariable Integer scheduleId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new RuntimeException("Bạn chưa đăng nhập");
        }

        medicineService.deleteMedicineSchedule(scheduleId, userDetails.getId());
        return ApiResponse.success(null, "Xóa lịch thuốc thành công");
    }















    

    

    

    
}
