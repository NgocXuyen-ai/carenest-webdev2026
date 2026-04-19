package com.carenest.backend.service;

import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.carenest.backend.dto.auth.ChangePasswordRequest;
import com.carenest.backend.dto.user.CurrentUserProfileResponse;
import com.carenest.backend.dto.user.UpdateCurrentUserProfileRequest;
import com.carenest.backend.model.HealthProfile;
import com.carenest.backend.model.User;
import com.carenest.backend.repository.HealthProfileRepository;
import com.carenest.backend.repository.UserRepository;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final HealthProfileRepository healthProfileRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       HealthProfileRepository healthProfileRepository,
                       PasswordEncoder passwordEncoder){
        this.userRepository = userRepository;
        this.healthProfileRepository = healthProfileRepository;
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

    public CurrentUserProfileResponse getCurrentUserProfile(Integer currentUserId) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user"));

        HealthProfile profile = healthProfileRepository.findFirstByUser_UserIdOrderByProfileAsc(currentUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ sức khỏe"));

        return CurrentUserProfileResponse.builder()
                .userId(user.getUserId())
                .profileId(profile.getProfile())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .fullName(profile.getFullName())
                .birthday(profile.getBirthday())
                .gender(profile.getGender())
                .bloodType(profile.getBloodType())
                .medicalHistory(profile.getMedicalHistory())
                .allergy(profile.getAllergy())
                .height(profile.getHeight())
                .weight(profile.getWeight())
                .emergencyContactPhone(profile.getEmergencyContactPhone())
                .avatarUrl(profile.getAvatarUrl())
                .build();
    }

    public CurrentUserProfileResponse updateCurrentUserProfile(Integer currentUserId, UpdateCurrentUserProfileRequest request) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user"));

        if (!user.getEmail().equalsIgnoreCase(request.getEmail())
                && userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new RuntimeException("Email đã tồn tại");
        }

        HealthProfile profile = healthProfileRepository.findFirstByUser_UserIdOrderByProfileAsc(currentUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ sức khỏe"));

        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPhoneNumber(request.getPhoneNumber());
        userRepository.save(user);

        profile.setFullName(request.getFullName().trim());
        profile.setBirthday(request.getBirthday());
        profile.setGender(request.getGender());
        profile.setBloodType(request.getBloodType());
        profile.setMedicalHistory(request.getMedicalHistory());
        profile.setAllergy(request.getAllergy());
        profile.setHeight(request.getHeight());
        profile.setWeight(request.getWeight());
        profile.setEmergencyContactPhone(request.getEmergencyContactPhone());
        healthProfileRepository.save(profile);

        return getCurrentUserProfile(currentUserId);
    }
}
