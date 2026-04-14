package com.carenest.backend.controller;

import org.springframework.web.bind.annotation.RestController;

import com.carenest.backend.dto.ChangePasswordRequest;
import com.carenest.backend.dto.ForgotPasswordRequest;
import com.carenest.backend.dto.LoginRequest;
import com.carenest.backend.dto.RegisterRequest;
import com.carenest.backend.dto.ResetPasswordRequest;
import com.carenest.backend.helper.ApiResponse;
import com.carenest.backend.model.User;
import com.carenest.backend.security.jwt.JwtUtil;
import com.carenest.backend.service.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

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
import org.springframework.web.bind.annotation.PutMapping;



@RestController
public class UserController {
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public UserController(UserService userService, JwtUtil jwtUtil, AuthenticationManager authenticationManager) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }
    
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        List<User> userList = this.userService.getAllUsers();
        return ApiResponse.success(userList);
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<User>> register(
            @Valid @RequestBody RegisterRequest request) {
        User user = userService.register(request);
        return ApiResponse.created(user);
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

            User user = userService.findUserByEmail(request.getEmail());
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
    public ResponseEntity<ApiResponse<String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        userService.sendForgotPasswordOtp(request);
        return ApiResponse.success("Đã gửi mã OTP về email");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<ResetPasswordRequest>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        this.userService.resetPassword(request);
        return ApiResponse.success(request);
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            HttpServletRequest request,
            @Valid @RequestBody ChangePasswordRequest changePasswordRequest) {
        userService.changePassword(request, changePasswordRequest);
        return ApiResponse.success("Đổi mật khẩu thành công");
    }
}
