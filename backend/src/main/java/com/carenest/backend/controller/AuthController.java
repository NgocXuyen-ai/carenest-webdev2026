package com.carenest.backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.carenest.backend.dto.auth.ForgotPasswordRequest;
import com.carenest.backend.dto.auth.LoginRequest;
import com.carenest.backend.dto.auth.RegisterRequest;
import com.carenest.backend.dto.auth.ResetPasswordRequest;
import com.carenest.backend.dto.auth.VerifyEmailRequest;
import com.carenest.backend.helper.ApiResponse;
import com.carenest.backend.model.User;
import com.carenest.backend.security.jwt.JwtUtil;
import com.carenest.backend.service.AuthService;

import jakarta.validation.Valid;

@RestController
public class AuthController {
    private final AuthService authService;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthController(AuthService authService, JwtUtil jwtUtil, AuthenticationManager authenticationManager) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }
    
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        List<User> userList = this.authService.getAllUsers();
        return ApiResponse.success(userList);
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterRequest>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ApiResponse.success(request, "Đăng ký thành công, vui lòng nhập mã xác minh được gửi trong email");
    }

    @PostMapping("/verify-email") 
    public ResponseEntity<ApiResponse<VerifyEmailRequest>> verifyEmail(@Valid @RequestBody VerifyEmailRequest req) { 
        authService.verifyEmail(req); 
        return ApiResponse.success(req, "Xác minh email thành công"); 
    }
    
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@Valid @RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );

            User user = authService.findUserByEmail(request.getEmail());
            String token = jwtUtil.generateToken(user.getEmail());

            Map<String, Object> data = new HashMap<>();
            data.put("userId", user.getUserId());
            data.put("email", user.getEmail());
            data.put("token", token);

            return ApiResponse.success(data, "Đăng nhập thành công");

        } catch (BadCredentialsException e) {
            return ApiResponse.error(
                    HttpStatus.UNAUTHORIZED,
                    "Sai email hoặc mật khẩu"
            );
        } catch (Exception e) {
            return ApiResponse.error(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Lỗi server"
            );
        }
    }
    
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<ForgotPasswordRequest>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
                authService.sendForgotPasswordOtp(request);
        return ApiResponse.success(request, "Đã gửi mã OTP về email");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<ResetPasswordRequest>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        this.authService.resetPassword(request);
        return ApiResponse.success(request, "Đổi mật khẩu thành công");
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout() {
        authService.logout();
        return ApiResponse.success("Đăng xuất thành công");
    }
}
