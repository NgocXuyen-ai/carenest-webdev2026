package com.carenest.backend.dto.family;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.carenest.backend.model.enums.BloodType;
import com.carenest.backend.model.enums.FamilyRole;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class FamilyMemberItemResponse {
    private Integer profileId;
    private String fullName;
    private LocalDate birthday;
    private Integer age;
    private FamilyRole role;
    private BloodType bloodType;
    private BigDecimal height;
    private BigDecimal weight;
    private String medicalHistory;
    private String allergy;
    private String healthStatus;
}
