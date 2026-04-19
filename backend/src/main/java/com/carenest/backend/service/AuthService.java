package com.carenest.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.carenest.backend.dto.auth.ForgotPasswordRequest;
import com.carenest.backend.dto.auth.RegisterRequest;
import com.carenest.backend.dto.auth.ResetPasswordRequest;
import com.carenest.backend.dto.auth.VerifyEmailRequest;
import com.carenest.backend.model.HealthProfile;
import com.carenest.backend.model.OtpToken;
import com.carenest.backend.model.User;
import com.carenest.backend.model.enums.OtpType;
import com.carenest.backend.repository.HealthProfileRepository;
import com.carenest.backend.repository.OtpTokenRepository;
import com.carenest.backend.repository.UserRepository;

@Service
public class AuthService {
    public final UserRepository userRepository;
    public final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final OtpTokenRepository otpTokenRepository;
    private final OtpService otpService;
    private final HealthProfileRepository healthProfileRepository;


    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, 
        MailService mailService, OtpTokenRepository otpTokenRepository, OtpService otpService,
        HealthProfileRepository healthProfileRepository){
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailService = mailService;
        this.otpTokenRepository = otpTokenRepository;
        this.otpService = otpService;
        this.healthProfileRepository = healthProfileRepository;

    }

    public void register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Confirm password không khớp");
        }

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email đã tồn tại");
        }

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setPhoneNumber(request.getPhoneNumber());
        user.setIsVerifyEmail(false);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setIsActive(true);

        User savedUser = userRepository.save(user);

        HealthProfile profile = new HealthProfile();
        profile.setUser(savedUser);
        profile.setFullName(request.getFullName().trim());
        healthProfileRepository.save(profile);

        String otp = otpService.createOtp(email, OtpType.VERIFY_EMAIL);
        mailService.sendOtpEmail(email, otp);
    }

    public void verifyEmail(VerifyEmailRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        String otp = req.getOtp();

        otpService.verifyOtp(email, otp, OtpType.VERIFY_EMAIL);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        user.setIsVerifyEmail(true);
        user.setUpdatedAt(LocalDateTime.now());

        userRepository.save(user);
    }

    public List<User> getAllUsers(){
        List<User> userList = this.userRepository.findAll();
        return userList;
    }

    public User findUserByEmail(String email){
        Optional<User> userOpt = this.userRepository.findByEmail(email);
        if (!userOpt.isPresent())
			return null;
		return userOpt.get();
    }

    public void sendForgotPasswordOtp(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email không tồn tại"));
    
        String otp = this.otpService.generateOtp();
    
        OtpToken token = otpTokenRepository.findByEmailAndType(user.getEmail(), OtpType.RESET_PASSWORD)
                .orElse(new OtpToken());
    
        token.setEmail(user.getEmail());
        token.setOtp(otp);
        token.setExpiryTime(LocalDateTime.now().plusMinutes(5));
        token.setUsed(false);
        token.setType(OtpType.RESET_PASSWORD);
    
        otpTokenRepository.save(token);
    
        mailService.sendOtpEmail(user.getEmail(), otp);
    }

    public void resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Mật khẩu xác nhận không khớp");
        }

        OtpToken token = otpTokenRepository
                .findByEmailAndOtpAndType(request.getEmail(), request.getOtp(), OtpType.RESET_PASSWORD)
                .orElseThrow(() -> new RuntimeException("OTP không đúng hoặc không tồn tại"));

        if (token.isUsed()) {
            throw new RuntimeException("OTP đã được sử dụng");
        }

        if (token.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP đã hết hạn");
        }

        User user = userRepository.findByEmail(token.getEmail())
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        token.setUsed(true);
        otpTokenRepository.save(token);
    }

    public void logout(){
        
    }

    public void sendOtp(String email) { 
        email = email.trim().toLowerCase(); 
        if (userRepository.existsByEmail(email)) { 
            throw new RuntimeException("Email đã tồn tại"); 
        } 
        String otp = otpService.createOtp(email, OtpType.VERIFY_EMAIL); 
        mailService.sendOtpEmail(email, otp); 
    }

}
