package com.carenest.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_request_log")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AiRequestLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer requestId;

    @NotBlank(message = "FeatureType không được để trống")
    @Size(max = 255, message = "FeatureType tối đa 255 ký tự")
    @Column(name = "feature_type", length = 255)
    private String featureType;

    @Column(name = "input_prompt", columnDefinition = "TEXT")
    private String inputPrompt;

    @Column(name = "output_raw", columnDefinition = "TEXT")
    private String outputRaw;

    @Size(max = 255, message = "Status tối đa 255 ký tự")
    @Column(name = "status", length = 255)
    private String status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Min(value = 0, message = "TotalTokens phải >= 0")
    @Column(name = "total_tokens")
    private Integer totalTokens;

    @DecimalMin(value = "0.0", inclusive = true, message = "ExecutionTime phải >= 0")
    @Column(name = "execution_time")
    private BigDecimal executionTime;

    @Size(max = 255, message = "Provider tối đa 255 ký tự")
    @Column(name = "provider", length = 255)
    private String provider;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
