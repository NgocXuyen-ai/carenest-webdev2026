package com.carenest.backend.dto.family;

import com.carenest.backend.model.enums.FamilyRole;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InviteMemberRequest {
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String receiverEmail;

    @NotNull(message = "Hãy chọn vai trò cho người mời")
    private FamilyRole role;
}
