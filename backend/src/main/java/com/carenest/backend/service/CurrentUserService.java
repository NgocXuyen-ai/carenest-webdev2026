package com.carenest.backend.service;

import org.springframework.stereotype.Service;

import com.carenest.backend.model.User;
import com.carenest.backend.repository.UserRepository;
import com.carenest.backend.security.jwt.JwtUtil;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public CurrentUserService(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    public User getCurrentUser(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Thiếu token đăng nhập");
        }

        String token = authHeader.substring(7);
        String email = jwtUtil.extractEmail(token);

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));
    }
}
