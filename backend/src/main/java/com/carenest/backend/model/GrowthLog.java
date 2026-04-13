package com.carenest.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "growth_log")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class GrowthLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer growthId;

    @NotNull(message = "Profile không được để trống")
    @ManyToOne
    @JoinColumn(name = "profile_id", nullable = false)
    private HealthProfile profile;

    @DecimalMin(value = "0.0", inclusive = false, message = "Cân nặng phải lớn hơn 0")
    @Digits(integer = 5, fraction = 2, message = "Cân nặng không hợp lệ")
    @Column(name = "weight")
    private BigDecimal weight;

    @DecimalMin(value = "0.0", inclusive = false, message = "Chiều cao phải lớn hơn 0")
    @Digits(integer = 5, fraction = 2, message = "Chiều cao không hợp lệ")
    @Column(name = "height")
    private BigDecimal height;

    @NotNull(message = "Ngày ghi nhận không được để trống")
    @Column(name = "record_date")
    private LocalDate recordDate;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;
}
