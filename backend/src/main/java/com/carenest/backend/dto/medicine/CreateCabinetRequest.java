package com.carenest.backend.dto.medicine;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateCabinetRequest {
    @NotBlank(message = "Tên tủ thuốc không được để trống")
    @Size(max = 255, message = "Tên tủ thuốc tối đa 255 ký tự")
    private String name;
}