package com.carenest.backend.dto.medicine;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TakeMedicineDoseRequest {

    @NotNull(message = "doseId không được để trống")
    private Integer doseId;

    @NotNull(message = "isTaken không được để trống")
    private Boolean isTaken;

    private String note;
}