package com.carenest.backend.controller;

import com.carenest.backend.dto.vaccination.CreateVaccinationRequest;
import com.carenest.backend.dto.vaccination.VaccinationTrackerResponse;
import com.carenest.backend.helper.ApiResponse;
import com.carenest.backend.service.VaccinationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vaccinations")
public class VaccinationController {

    private final VaccinationService vaccinationService;

    public VaccinationController(VaccinationService vaccinationService) {
        this.vaccinationService = vaccinationService;
    }

    @GetMapping("/{profileId}")
    public ResponseEntity<ApiResponse<List<VaccinationTrackerResponse>>> getTracker(@PathVariable Integer profileId) {
        try {
            List<VaccinationTrackerResponse> data = vaccinationService.getTrackerData(profileId);
            return ApiResponse.success(data, "Lấy lịch tiêm thành công");
        } catch (RuntimeException e) {
            return ApiResponse.error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping("/{profileId}")
    public ResponseEntity<ApiResponse<Void>> addVaccination(
            @PathVariable Integer profileId,
            @Valid @RequestBody CreateVaccinationRequest request
    ) {
        try {
            vaccinationService.addVaccination(profileId, request);
            return ApiResponse.success(null, "Lưu thông tin tiêm chủng thành công");
        } catch (RuntimeException e) {
            return ApiResponse.error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
