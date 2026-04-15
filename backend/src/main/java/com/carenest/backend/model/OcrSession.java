package com.carenest.backend.model;

import java.util.ArrayList;
import java.util.List;

import com.carenest.backend.model.enums.OcrSessionStatus;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ocr_session")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class OcrSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer ocrId;

    @NotNull(message = "Profile không được để trống")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private HealthProfile profile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id")
    private AiRequestLog requestLog;

    @Size(max = 255, message = "ImageUrl tối đa 255 ký tự")
    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @Column(name = "raw_text", columnDefinition = "TEXT")
    private String rawText;

    @Column(name = "structure_data", columnDefinition = "TEXT")
    private String structureData;

    @Column(name = "prompt_request", columnDefinition = "TEXT")
    private String promptRequest;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private OcrSessionStatus status;

    @OneToMany(mappedBy = "ocrSession")
    private List<AiChatDetail> chatDetails = new ArrayList<>();
}