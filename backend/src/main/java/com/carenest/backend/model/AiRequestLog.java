package com.carenest.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.carenest.backend.model.enums.AiFeatureType;
import com.carenest.backend.model.enums.AiProvider;
import com.carenest.backend.model.enums.AiRequestStatus;

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

    @NotNull(message = "FeatureType không được để trống")
    @Enumerated(EnumType.STRING)
    @Column(name = "feature_type", length = 255)
    private AiFeatureType featureType;

    @Column(name = "input_prompt", columnDefinition = "TEXT")
    private String inputPrompt;

    @Column(name = "output_raw", columnDefinition = "TEXT")
    private String outputRaw;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 255)
    private AiRequestStatus status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Min(value = 0, message = "TotalTokens phải >= 0")
    @Column(name = "total_tokens")
    private Integer totalTokens;

    @DecimalMin(value = "0.0", inclusive = true, message = "ExecutionTime phải >= 0")
    @Column(name = "execution_time")
    private BigDecimal executionTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", length = 255)
    private AiProvider provider;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "requestLog")
    private List<AiChatDetail> chatDetails = new ArrayList<>();

    @OneToMany(mappedBy = "requestLog")
    private List<OcrSession> ocrSessions = new ArrayList<>();
}