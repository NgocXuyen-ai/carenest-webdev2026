package com.carenest.backend.dto.family;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateFamilyRequest {
    
    @NotBlank(message = "Tên family không được để trống")
    @Size(max = 255, message = "Tên family tối đa 255 ký tự")
    private String name; 
}
