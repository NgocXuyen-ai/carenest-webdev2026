package com.carenest.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carenest.backend.dto.auth.ChangePasswordRequest;
import com.carenest.backend.dto.user.CurrentUserProfileResponse;
import com.carenest.backend.dto.user.UpdateCurrentUserProfileRequest;
import com.carenest.backend.helper.ApiResponse;
import com.carenest.backend.security.CustomUserDetails;
import com.carenest.backend.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PatchMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword2(
            @RequestBody ChangePasswordRequest body,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new RuntimeException("Bạn chưa đăng nhập");
        }

        Integer currentUserId = ((CustomUserDetails) userDetails).getId();
        userService.changePassword(currentUserId, body);
        return ApiResponse.success(null, "Đổi mật khẩu thành công");
    }

    @GetMapping("/me/profile")
    public ResponseEntity<ApiResponse<CurrentUserProfileResponse>> getCurrentUserProfile(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new RuntimeException("Bạn chưa đăng nhập");
        }

        Integer currentUserId = ((CustomUserDetails) userDetails).getId();
        CurrentUserProfileResponse response = userService.getCurrentUserProfile(currentUserId);
        return ApiResponse.success(response, "Lấy hồ sơ người dùng thành công");
    }

    @PatchMapping("/me/profile")
    public ResponseEntity<ApiResponse<CurrentUserProfileResponse>> updateCurrentUserProfile(
            @Valid @RequestBody UpdateCurrentUserProfileRequest body,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new RuntimeException("Bạn chưa đăng nhập");
        }

        Integer currentUserId = ((CustomUserDetails) userDetails).getId();
        CurrentUserProfileResponse response = userService.updateCurrentUserProfile(currentUserId, body);
        return ApiResponse.success(response, "Cập nhật hồ sơ người dùng thành công");
    }
}
