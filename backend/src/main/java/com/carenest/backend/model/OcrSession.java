package com.carenest.backend.model;

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
    @ManyToOne
    @JoinColumn(name = "profile_id", nullable = false)
    private HealthProfile profile;

    @Column(name = "request_id")
    private Integer requestId;

    @Size(max = 255, message = "ImageUrl tối đa 255 ký tự")
    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @Column(name = "raw_text", columnDefinition = "TEXT")
    private String rawText;

    @Column(name = "structure_data", columnDefinition = "TEXT")
    private String structureData;

    @Column(name = "prompt_request", columnDefinition = "TEXT")
    private String promptRequest;

    @Size(max = 255, message = "Status tối đa 255 ký tự")
    @Column(name = "status", length = 255)
    private String status;
}
