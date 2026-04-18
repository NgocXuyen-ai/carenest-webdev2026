package com.carenest.backend.dto.family;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.carenest.backend.model.enums.BloodType;
import com.carenest.backend.model.enums.FamilyRole;
import com.carenest.backend.model.enums.Gender;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateFamilyMemberProfileRequest {
    private String fullName;
    private LocalDate birthday;
    private Gender gender;
    private BloodType bloodType;
    private String medicalHistory;
    private String allergy;
    private BigDecimal height;
    private BigDecimal weight;
    private String emergencyContactPhone;
    private FamilyRole role;
}
