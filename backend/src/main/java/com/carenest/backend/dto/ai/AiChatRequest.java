package com.carenest.backend.dto.ai;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiChatRequest {
    private Integer profileId;
    private Integer conversationId;

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    private String message;
}
