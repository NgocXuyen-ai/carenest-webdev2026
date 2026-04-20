package com.carenest.backend.dto.family;

import com.carenest.backend.model.enums.FamilyRole;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateFamilyMemberRoleRequest {
    @NotNull(message = "Vai trò không được để trống")
    private FamilyRole role;
}
