package com.carenest.backend.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.carenest.backend.model.OtpToken;
import com.carenest.backend.model.enums.OtpType;
import com.carenest.backend.repository.OtpTokenRepository;

import jakarta.transaction.Transactional;

@Service
public class OtpService {

    private final OtpTokenRepository otpTokenRepository;

    public OtpService(OtpTokenRepository otpTokenRepository) {
        this.otpTokenRepository = otpTokenRepository;
    }

    public String generateOtp() {
        return String.valueOf((int) ((Math.random() * 900000) + 100000));
    }

    @Transactional
    public String createOtp(String email, OtpType type) {
        otpTokenRepository.deleteByEmailAndType(email, type);

        String otp = generateOtp();

        OtpToken token = new OtpToken();
        token.setEmail(email);
        token.setOtp(otp);
        token.setType(type);
        token.setUsed(false);
        token.setExpiryTime(LocalDateTime.now().plusMinutes(5));

        otpTokenRepository.save(token);

        return otp;
    }

    @Transactional
    public boolean verifyOtp(String email, String otp, OtpType type) {
        OtpToken token = otpTokenRepository
                .findByEmailAndOtpAndTypeAndUsedFalse(email, otp, type)
                .orElseThrow(() -> new RuntimeException("OTP không hợp lệ"));

        if (token.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP đã hết hạn");
        }

        token.setUsed(true);
        otpTokenRepository.save(token);

        return true;
    }

    public boolean verifyEmailOtp(String email, String otp) {
        return verifyOtp(email, otp, OtpType.VERIFY_EMAIL);
    }
}
