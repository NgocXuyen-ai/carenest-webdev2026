package com.carenest.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.carenest.backend.dto.auth.ChangePasswordRequest;
import com.carenest.backend.helper.ApiResponse;
import com.carenest.backend.service.UserService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PatchMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            HttpServletRequest request,
            @RequestBody ChangePasswordRequest body
    ) {
        userService.changePassword(request, body);
        return ApiResponse.success(null, "Đổi mật khẩu thành công");
    }
}