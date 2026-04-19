package com.carenest.backend.controller;

import com.carenest.backend.dto.growth.CreateGrowthLogRequest;
import com.carenest.backend.dto.growth.GrowthSummaryResponse;
import com.carenest.backend.helper.ApiResponse;
import com.carenest.backend.service.GrowthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/growth")
public class GrowthController {

    private final GrowthService growthService;

    public GrowthController(GrowthService growthService) {
        this.growthService = growthService;
    }

    @GetMapping("/{profileId}")
    public ResponseEntity<ApiResponse<GrowthSummaryResponse>> getGrowthSummary(@PathVariable Integer profileId) {
        try {
            GrowthSummaryResponse data = growthService.getGrowthSummary(profileId);
            return ApiResponse.success(data, "Lấy thông tin tăng trưởng thành công");
        } catch (RuntimeException e) {
            return ApiResponse.error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping("/log")
    public ResponseEntity<ApiResponse<Void>> addGrowthLog(@Valid @RequestBody CreateGrowthLogRequest request) {
        try {
            growthService.addGrowthLog(request);
            return ApiResponse.success(null, "Ghi nhận thông số thành công");
        } catch (RuntimeException e) {
            return ApiResponse.error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
