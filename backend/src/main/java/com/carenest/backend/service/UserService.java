package com.carenest.backend.service;

import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.carenest.backend.dto.auth.ChangePasswordRequest;
import com.carenest.backend.model.User;
import com.carenest.backend.repository.UserRepository;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder){
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public void changePassword(Integer currentUserId, ChangePasswordRequest req) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user"));

        if (!req.getNewPassword().equals(req.getConfirmPassword())) {
            throw new RuntimeException("Mật khẩu xác nhận không khớp");
        }

        if (!passwordEncoder.matches(req.getOldPassword(), currentUser.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu cũ không đúng");
        }

        if (passwordEncoder.matches(req.getNewPassword(), currentUser.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu mới không được trùng mật khẩu cũ");
        }

        currentUser.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(currentUser);
    }
}
