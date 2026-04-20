package com.carenest.backend.controller;

import com.carenest.backend.dto.growth.CreateGrowthLogRequest;
import com.carenest.backend.dto.growth.GrowthSummaryResponse;
import com.carenest.backend.helper.ApiResponse;
import com.carenest.backend.security.CustomUserDetails;
import com.carenest.backend.service.GrowthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    public ResponseEntity<ApiResponse<GrowthSummaryResponse>> getGrowthSummary(
            @PathVariable Integer profileId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        try {
            if (userDetails == null) {
                throw new RuntimeException("Bạn chưa đăng nhập");
            }

            GrowthSummaryResponse data = growthService.getGrowthSummary(userDetails.getId(), profileId);
            return ApiResponse.success(data, "Lấy thông tin tăng trưởng thành công");
        } catch (RuntimeException e) {
            return ApiResponse.error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping("/log")
    public ResponseEntity<ApiResponse<Void>> addGrowthLog(
            @Valid @RequestBody CreateGrowthLogRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        try {
            if (userDetails == null) {
                throw new RuntimeException("Bạn chưa đăng nhập");
            }

            growthService.addGrowthLog(userDetails.getId(), request);
            return ApiResponse.success(null, "Ghi nhận thông số thành công");
        } catch (RuntimeException e) {
            return ApiResponse.error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}

