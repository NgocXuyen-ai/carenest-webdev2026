package com.carenest.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.carenest.backend.model.OtpToken;
import com.carenest.backend.model.enums.OtpType;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {

    Optional<OtpToken> findByEmailAndType(String email, OtpType type); 
    Optional<OtpToken> findTopByEmailAndTypeAndUsedFalseOrderByIdDesc(String email, OtpType type); 
    Optional<OtpToken> findByEmailAndOtpAndTypeAndUsedFalse(String email, String otp, OtpType type); 
    Optional<OtpToken> findByEmailAndOtpAndType(String email, String otp, OtpType type); 
    void deleteByEmailAndType(String email, OtpType type);
}
