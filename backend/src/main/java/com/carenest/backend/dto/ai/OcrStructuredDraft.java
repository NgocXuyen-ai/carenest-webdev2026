package com.carenest.backend.dto.ai;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class OcrStructuredDraft {
    private List<OcrMedicineDraft> medicines = new ArrayList<>();
    private String doctorName;
    private String clinicName;
    private String date;
}
