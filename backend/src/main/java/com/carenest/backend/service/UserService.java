package com.carenest.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.carenest.backend.dto.ChangePasswordRequest;
import com.carenest.backend.dto.ForgotPasswordRequest;
import com.carenest.backend.dto.RegisterRequest;
import com.carenest.backend.dto.ResetPasswordRequest;
import com.carenest.backend.model.PasswordResetToken;
import com.carenest.backend.model.User;
import com.carenest.backend.repository.PasswordResetTokenRepository;
import com.carenest.backend.repository.UserRepository;
import com.carenest.backend.security.jwt.JwtUtil;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class UserService {
    public final UserRepository userRepository;
    public final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final PasswordResetTokenRepository tokenRepository;
    private final JwtUtil jwtUtil;


    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, 
        MailService mailService, PasswordResetTokenRepository tokenRepository,
        JwtUtil jwtUtil){
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailService = mailService;
        this.tokenRepository = tokenRepository;
        this.jwtUtil = jwtUtil;
    }

    public User register(RegisterRequest request){
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Password không khớp");
        }
    
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã tồn tại");
        }
    
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    
        return userRepository.save(user);
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

        String otp = generateOtp();

        PasswordResetToken token = tokenRepository.findByEmail(user.getEmail())
                .orElse(new PasswordResetToken());

        token.setEmail(user.getEmail());
        token.setOtp(otp);
        token.setExpiryTime(LocalDateTime.now().plusMinutes(5));
        token.setUsed(false);

        tokenRepository.save(token);

        mailService.sendOtpEmail(user.getEmail(), otp);
    }

    public void resetPassword(ResetPasswordRequest request) {

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Mật khẩu xác nhận không khớp");
        }
    
        PasswordResetToken token = tokenRepository.findByOtp(request.getOtp())
                .orElseThrow(() -> new RuntimeException("OTP không tồn tại"));
    
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
        tokenRepository.save(token);
    }

    public void changePassword(HttpServletRequest request, ChangePasswordRequest req) {
        User currentUser = getCurrentUser(request);
    
        if (!req.getNewPassword().equals(req.getConfirmPassword())) {
            throw new RuntimeException("Mật khẩu xác nhận không khớp");
        }
    
        if (!passwordEncoder.matches(req.getOldPassword(), currentUser.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu cũ không đúng");
        }
    
        currentUser.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(currentUser);
    }

    private String generateOtp() {
        return String.valueOf((int) (Math.random() * 900000) + 100000);
    }

    private User getCurrentUser(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Missing token");
        }

        String token = authHeader.substring(7);
        String email = jwtUtil.extractEmail(token);

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public void sendChangePasswordOtp(HttpServletRequest request) {
        User currentUser = getCurrentUser(request);

        String otp = generateOtp();

        PasswordResetToken token = tokenRepository.findByEmail(currentUser.getEmail())
                .orElse(new PasswordResetToken());

        token.setEmail(currentUser.getEmail());
        token.setOtp(otp);
        token.setExpiryTime(LocalDateTime.now().plusMinutes(5));
        token.setUsed(false);

        tokenRepository.save(token);

        mailService.sendOtpEmail(
                currentUser.getEmail(),
                otp
        );
    }
}
