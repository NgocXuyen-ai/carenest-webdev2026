package com.carenest.backend.dto.family;

import com.carenest.backend.model.enums.FamilyRole;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JoinFamilyByCodeRequest {
    @NotBlank(message = "Mã tham gia không được để trống")
    private String joinCode;

    private FamilyRole role;
}
