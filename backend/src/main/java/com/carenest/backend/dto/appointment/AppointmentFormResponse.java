package com.carenest.backend.dto.appointment;

import java.util.List;

import com.carenest.backend.dto.medicine.ProfileOptionResponse;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AppointmentFormResponse {
    private List<ProfileOptionResponse> profiles;
}
