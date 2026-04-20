package com.carenest.backend.dto.user;

import com.carenest.backend.model.enums.BloodType;
import com.carenest.backend.model.enums.Gender;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class UpdateCurrentUserProfileRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(max = 255, message = "Họ và tên tối đa 255 ký tự")
    private String fullName;

    @Email(message = "Email không hợp lệ")
    @NotBlank(message = "Email không được để trống")
    private String email;

    @Pattern(
            regexp = "^(0|\\+84)[0-9]{9,10}$",
            message = "Số điện thoại không hợp lệ"
    )
    private String phoneNumber;

    @NotNull(message = "Ngày sinh không được để trống")
    @Past(message = "Ngày sinh phải là ngày trong quá khứ")
    private LocalDate birthday;

    @NotNull(message = "Giới tính không được để trống")
    private Gender gender;

    @NotNull(message = "Nhóm máu không được để trống")
    private BloodType bloodType;

    @Size(max = 2000, message = "Tiền sử bệnh lý tối đa 2000 ký tự")
    private String medicalHistory;

    @Size(max = 1000, message = "Dị ứng tối đa 1000 ký tự")
    private String allergy;

    @NotNull(message = "Chiều cao không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Chiều cao phải lớn hơn 0")
    private BigDecimal height;

    @NotNull(message = "Cân nặng không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Cân nặng phải lớn hơn 0")
    @Digits(integer = 5, fraction = 2, message = "Cân nặng không hợp lệ")
    private BigDecimal weight;

    @Pattern(
            regexp = "^(0|\\+84)[0-9]{9,10}$",
            message = "Số điện thoại liên hệ khẩn cấp không hợp lệ"
    )
    private String emergencyContactPhone;
}
