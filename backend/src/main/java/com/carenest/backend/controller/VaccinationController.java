package com.carenest.backend.controller;

import com.carenest.backend.dto.ApiResponse;
import com.carenest.backend.dto.vaccination.CreateVaccinationRequest;
import com.carenest.backend.dto.vaccination.VaccinationTrackerResponse;
import com.carenest.backend.service.VaccinationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vaccination")
public class VaccinationController {

    private final VaccinationService vaccinationService;

    public VaccinationController(VaccinationService vaccinationService) {
        this.vaccinationService = vaccinationService;
    }


    @GetMapping("/{profileId}")
    public ResponseEntity<ApiResponse<List<VaccinationTrackerResponse>>> getTracker(@PathVariable Integer profileId) {
        try {
            List<VaccinationTrackerResponse> data = vaccinationService.getTrackerData(profileId);
            return ResponseEntity.ok(ApiResponse.success(data, "Lấy lịch tiêm thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(HttpStatus.BAD_REQUEST, e.getMessage()));
        }
    }

    /**
     * API Thêm lịch tiêm chủng mới cho bé
     */
    @PostMapping("/{profileId}")
    public ResponseEntity<ApiResponse<Void>> addVaccination(
            @PathVariable Integer profileId,
            @Valid @RequestBody CreateVaccinationRequest request) {
        try {
            vaccinationService.addVaccination(profileId, request);
            return ResponseEntity.ok(ApiResponse.success(null, "Lưu thông tin tiêm chủng thành công"));
        } catch (RuntimeException e) {
            // Đảm bảo truyền HttpStatus.BAD_REQUEST để khớp với method error(HttpStatus, String)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(HttpStatus.BAD_REQUEST, e.getMessage()));
        }
    }
}