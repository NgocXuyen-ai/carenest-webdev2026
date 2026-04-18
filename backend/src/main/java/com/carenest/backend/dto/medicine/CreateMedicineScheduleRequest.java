package com.carenest.backend.dto.medicine;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class CreateMedicineScheduleRequest {
    @NotNull(message = "Hãy chọn người bạn tạo lịch")
    private Integer profile;

    @NotNull(message = "Hãy chọn thuốc cần uống")
    private Integer medicineId;

    @NotBlank(message = "Tên thuốc không được để trống")
    @Size(max = 255, message = "Tên thuốc tối đa 255 ký tự")
    private String medicineName;

    @NotBlank(message = "Liều dùng không được để trống")
    @Size(max = 255, message = "Liều dùng tối đa 255 ký tự")
    private String dosage;

    @NotNull(message = "Tần suất không được để trống")
    @Min(value = 1, message = "Tần suất phải >= 1")
    private Integer frequency;

    @Size(max = 2000, message = "Ghi chú tối đa 2000 ký tự")
    private String note;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDate endDate;
}