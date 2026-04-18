package com.carenest.backend.controller;

import com.carenest.backend.dto.ApiResponse;
import com.carenest.backend.dto.growth.CreateGrowthLogRequest;
import com.carenest.backend.dto.growth.GrowthSummaryResponse;
import com.carenest.backend.service.GrowthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus; // Thêm import này
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/growth")
public class GrowthController {

    private final GrowthService growthService;

    public GrowthController(GrowthService growthService) {
        this.growthService = growthService;
    }

    @GetMapping("/{profileId}")
    public ResponseEntity<ApiResponse<GrowthSummaryResponse>> getGrowthSummary(@PathVariable Integer profileId) {
        try {
            GrowthSummaryResponse data = growthService.getGrowthSummary(profileId);
            return ResponseEntity.ok(ApiResponse.success(data, "Lấy thông tin tăng trưởng thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(HttpStatus.BAD_REQUEST, e.getMessage()));
        }
    }

    @PostMapping("/log")
    public ResponseEntity<ApiResponse<Void>> addGrowthLog(@Valid @RequestBody CreateGrowthLogRequest request) {
        try {
            growthService.addGrowthLog(request);
            return ResponseEntity.ok(ApiResponse.success(null, "Ghi nhận thông số thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(HttpStatus.BAD_REQUEST, e.getMessage()));
        }
    }
}