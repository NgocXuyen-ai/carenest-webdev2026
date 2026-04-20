package com.carenest.backend.controller;

import com.carenest.backend.dto.ai.AiChatRequest;
import com.carenest.backend.dto.ai.AiOcrRequest;
import com.carenest.backend.dto.ai.OcrConfirmRequest;
import com.carenest.backend.dto.ai.OcrConfirmResponse;
import com.carenest.backend.helper.ApiResponse;
import com.carenest.backend.security.CustomUserDetails;
import com.carenest.backend.service.AiProxyService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping(value = "/api/v1/ai", produces = MediaType.APPLICATION_JSON_VALUE)
public class AiController {

    private final AiProxyService aiProxyService;

    public AiController(AiProxyService aiProxyService) {
        this.aiProxyService = aiProxyService;
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<Map<String, Object>>> chat(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AiChatRequest request
    ) {
        Map<String, Object> response = aiProxyService.chat(userDetails.getId(), request);
        return ApiResponse.success(response, "Chat AI thành công");
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConversations(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "20") Integer limit,
            @RequestParam(defaultValue = "0") Integer offset
    ) {
        Map<String, Object> response = aiProxyService.listConversations(userDetails.getId(), limit, offset);
        return ApiResponse.success(response, "Lấy danh sách hội thoại AI thành công");
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConversationMessages(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer conversationId
    ) {
        Map<String, Object> response = aiProxyService.getConversationMessages(userDetails.getId(), conversationId);
        return ApiResponse.success(response, "Lấy lịch sử chat AI thành công");
    }

    @PostMapping("/ocr")
    public ResponseEntity<ApiResponse<Map<String, Object>>> ocr(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AiOcrRequest request
    ) {
        Map<String, Object> response = aiProxyService.ocr(userDetails.getId(), request);
        return ApiResponse.success(response, "OCR toa thuốc thành công");
    }

    @PostMapping("/ocr/{ocrId}/confirm")
    public ResponseEntity<ApiResponse<OcrConfirmResponse>> confirmOcr(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer ocrId,
            @Valid @RequestBody OcrConfirmRequest request
    ) {
        request.setOcrId(ocrId);
        OcrConfirmResponse response = aiProxyService.confirmOcr(userDetails.getId(), request);
        return ApiResponse.success(response, "Đã xác nhận và nhập dữ liệu OCR vào hệ thống");
    }

        @PostMapping(
            value = "/voice/chat",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
        )
    public ResponseEntity<ApiResponse<Map<String, Object>>> voiceChat(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestPart("audio") MultipartFile audio,
            @RequestParam(required = false) Integer profileId,
            @RequestParam(required = false) Integer conversationId
    ) {
        Map<String, Object> response = aiProxyService.voiceChat(userDetails.getId(), profileId, conversationId, audio);
        return ApiResponse.success(response, "Trợ lý giọng nói phản hồi thành công");
    }

        @PostMapping(value = "/voice/tts", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> tts(
            @RequestBody Map<String, String> body
    ) {
        String text = body.getOrDefault("text", "");
        String lang = body.getOrDefault("lang", "vi");
        Map<String, Object> response = aiProxyService.tts(text, lang);
        return ApiResponse.success(response, "TTS thành công");
    }
}
