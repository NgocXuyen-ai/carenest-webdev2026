package com.carenest.backend.dto.ai;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OcrConfirmRequest {
    private Integer ocrId;

    @NotNull(message = "Profile id không được để trống")
    private Integer profileId;

    @NotNull(message = "Dữ liệu OCR không được để trống")
    private OcrStructuredDraft structuredData;
}
