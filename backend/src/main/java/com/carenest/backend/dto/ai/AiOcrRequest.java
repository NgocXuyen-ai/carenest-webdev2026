package com.carenest.backend.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiOcrRequest {
    @NotNull(message = "Profile id không được để trống")
    private Integer profileId;

    @NotBlank(message = "Ảnh toa thuốc không được để trống")
    private String imageBase64;
}
