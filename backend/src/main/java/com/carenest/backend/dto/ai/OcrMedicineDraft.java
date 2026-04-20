package com.carenest.backend.dto.ai;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OcrMedicineDraft {
    private String name;
    private String dosage;
    private Integer frequency;
    private String duration;
    private String note;
}
