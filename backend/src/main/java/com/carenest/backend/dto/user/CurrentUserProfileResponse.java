package com.carenest.backend.dto.user;

import com.carenest.backend.model.enums.BloodType;
import com.carenest.backend.model.enums.Gender;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
public class CurrentUserProfileResponse {
    private Integer userId;
    private Integer profileId;
    private String email;
    private String phoneNumber;
    private String fullName;
    private LocalDate birthday;
    private Gender gender;
    private BloodType bloodType;
    private String medicalHistory;
    private String allergy;
    private BigDecimal height;
    private BigDecimal weight;
    private String emergencyContactPhone;
    private String avatarUrl;
}
