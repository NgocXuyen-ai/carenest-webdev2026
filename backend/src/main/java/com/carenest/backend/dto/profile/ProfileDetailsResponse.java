package com.carenest.backend.dto.profile;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.carenest.backend.model.enums.BloodType;
import com.carenest.backend.model.enums.Gender;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class ProfileDetailsResponse {
    private Integer profileId;
    private String fullName;
    private LocalDate birthday;
    private Integer age;
    private Gender gender;
    private BloodType bloodType;
    private BigDecimal height;
    private BigDecimal weight;
    private String medicalHistory;
    private String allergy;
    private String emergencyContactPhone;
    private String healthStatus;
}
