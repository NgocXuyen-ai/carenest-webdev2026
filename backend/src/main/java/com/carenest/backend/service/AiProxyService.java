package com.carenest.backend.service;

import com.carenest.backend.dto.ai.AiChatRequest;
import com.carenest.backend.dto.ai.AiOcrRequest;
import com.carenest.backend.dto.ai.OcrConfirmRequest;
import com.carenest.backend.dto.ai.OcrConfirmResponse;
import com.carenest.backend.dto.ai.OcrMedicineDraft;
import com.carenest.backend.dto.medicine.CreateMedicineRequest;
import com.carenest.backend.dto.medicine.CreateMedicineScheduleRequest;
import com.carenest.backend.model.DetailsMedicine;
import com.carenest.backend.model.MedicineSchedule;
import com.carenest.backend.repository.DetailsMedicineRepository;
import com.carenest.backend.repository.MedicineScheduleRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiProxyService {

    private static final Pattern FIRST_INTEGER_PATTERN = Pattern.compile("(\\d+)");
    private static final Logger log = LoggerFactory.getLogger(AiProxyService.class);

    private final AiContextService aiContextService;
    private final MedicineService medicineService;
    private final DetailsMedicineRepository detailsMedicineRepository;
    private final MedicineScheduleRepository medicineScheduleRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.service.base-url}")
    private String aiServiceBaseUrl;

    @Value("${ai.service.internal-token}")
    private String aiInternalToken;

    @Value("${ai.service.connect-timeout-ms:5000}")
    private int aiServiceConnectTimeoutMs;

    @Value("${ai.service.read-timeout-ms:55000}")
    private int aiServiceReadTimeoutMs;

    public AiProxyService(AiContextService aiContextService,
                          MedicineService medicineService,
                          DetailsMedicineRepository detailsMedicineRepository,
                          MedicineScheduleRepository medicineScheduleRepository,
                          ObjectMapper objectMapper) {
        this.aiContextService = aiContextService;
        this.medicineService = medicineService;
        this.detailsMedicineRepository = detailsMedicineRepository;
        this.medicineScheduleRepository = medicineScheduleRepository;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void configureRestTemplate() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(aiServiceConnectTimeoutMs);
        requestFactory.setReadTimeout(aiServiceReadTimeoutMs);
        restTemplate.setRequestFactory(requestFactory);
        log.info("Configured AI RestTemplate timeouts: connect={}ms, read={}ms",
                aiServiceConnectTimeoutMs,
                aiServiceReadTimeoutMs);
    }

    public Map<String, Object> chat(Integer userId, AiChatRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("user_id", userId);
        body.put("message", request.getMessage());
        body.put("conversation_id", request.getConversationId());
        body.put("context", aiContextService.buildAiRoutingContext(userId, request.getProfileId()));
        return postJson("/internal/chat", body);
    }

    public Map<String, Object> listConversations(Integer userId, Integer limit, Integer offset) {
        String url = UriComponentsBuilder.fromUriString(aiServiceBaseUrl + "/internal/conversations")
                .queryParam("user_id", userId)
                .queryParam("limit", limit)
                .queryParam("offset", offset)
                .toUriString();
        return exchangeForMap(url, HttpMethod.GET, null);
    }

    public Map<String, Object> getConversationMessages(Integer userId, Integer conversationId) {
        String url = UriComponentsBuilder.fromUriString(aiServiceBaseUrl + "/internal/conversations/" + conversationId + "/messages")
                .queryParam("user_id", userId)
                .toUriString();
        return exchangeForMap(url, HttpMethod.GET, null);
    }

    public Map<String, Object> ocr(Integer userId, AiOcrRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("user_id", userId);
        body.put("profile_id", request.getProfileId());
        body.put("image_base64", request.getImageBase64());
        return postJson("/internal/ocr", body);
    }

    public Map<String, Object> voiceChat(Integer userId, Integer profileId, Integer conversationId, MultipartFile audio) {
        log.info("Voice chat proxy start: userId={}, profileId={}, conversationId={}, filename={}, size={} bytes",
            userId,
            profileId,
            conversationId,
            audio != null ? audio.getOriginalFilename() : null,
            audio != null ? audio.getSize() : null);

        HttpHeaders headers = buildHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("user_id", String.valueOf(userId));
        if (conversationId != null) {
            body.add("conversation_id", String.valueOf(conversationId));
        }
        body.add("context_json", writeContextAsJson(aiContextService.buildAiRoutingContext(userId, profileId)));
        body.add("audio", createAudioResource(audio));

        Map<String, Object> result = exchangeForMap(
                aiServiceBaseUrl + "/internal/voice/chat",
                HttpMethod.POST,
                new HttpEntity<>(body, headers)
        );

        log.info("Voice chat proxy done: userId={}, conversationId={}, responseKeys={}",
            userId,
            result.get("conversation_id"),
            result.keySet());
        return result;
    }

    public Map<String, Object> tts(String text, String lang) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("text", text);
        body.put("lang", lang != null ? lang : "vi");

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Token", aiInternalToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<byte[]> response = restTemplate.exchange(
                aiServiceBaseUrl + "/internal/voice/tts",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                byte[].class
        );

        byte[] audioBytes = response.getBody();
        String audioBase64 = audioBytes != null ? Base64.getEncoder().encodeToString(audioBytes) : "";

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("audio_base64", audioBase64);
        return result;
    }

    public OcrConfirmResponse confirmOcr(Integer userId, OcrConfirmRequest request) {
        List<Integer> medicineIds = new ArrayList<>();
        List<Integer> scheduleIds = new ArrayList<>();

        Integer cabinetId = medicineService.getMyCabinet(userId).getCabinetId();
        LocalDate startDate = parsePrescriptionDate(request.getStructuredData().getDate());

        for (OcrMedicineDraft medicineDraft : request.getStructuredData().getMedicines()) {
            if (medicineDraft.getName() == null || medicineDraft.getName().isBlank()) {
                continue;
            }

            DetailsMedicine medicine = detailsMedicineRepository
                    .findByCabinet_CabinetIdAndNameIgnoreCase(cabinetId, medicineDraft.getName().trim())
                    .orElseGet(() -> createMedicineFromDraft(userId, medicineDraft));

            CreateMedicineScheduleRequest scheduleRequest = new CreateMedicineScheduleRequest();
            scheduleRequest.setProfile(request.getProfileId());
            scheduleRequest.setMedicineId(medicine.getMedicineId());
            scheduleRequest.setMedicineName(medicine.getName());
            scheduleRequest.setDosage(defaultValue(medicineDraft.getDosage(), "1 lieu"));
            scheduleRequest.setFrequency(
                    medicineDraft.getFrequency() != null && medicineDraft.getFrequency() > 0
                            ? medicineDraft.getFrequency()
                            : 1
            );
            scheduleRequest.setNote(medicineDraft.getNote());
            scheduleRequest.setStartDate(startDate);
            scheduleRequest.setEndDate(parseEndDate(startDate, medicineDraft.getDuration()));

            medicineService.createMedicineSchedule(userId, scheduleRequest);

            medicineIds.add(medicine.getMedicineId());
            MedicineSchedule schedule = medicineScheduleRepository
                    .findByProfile_ProfileOrderByStartDateAsc(request.getProfileId())
                    .stream()
                    .filter(item -> item.getMedicine().getMedicineId().equals(medicine.getMedicineId()))
                    .reduce((first, second) -> second)
                    .orElse(null);
            if (schedule != null) {
                scheduleIds.add(schedule.getScheduleId());
            }
        }

        return OcrConfirmResponse.builder()
                .ocrId(request.getOcrId())
                .medicineIds(medicineIds)
                .scheduleIds(scheduleIds)
                .build();
    }

    private DetailsMedicine createMedicineFromDraft(Integer userId, OcrMedicineDraft medicineDraft) {
        CreateMedicineRequest createMedicineRequest = new CreateMedicineRequest();
        createMedicineRequest.setName(medicineDraft.getName().trim());
        createMedicineRequest.setQuantity(1);
        createMedicineRequest.setUnit("don vi");
        medicineService.createMedicine(userId, createMedicineRequest);

        Integer cabinetId = medicineService.getMyCabinet(userId).getCabinetId();
        return detailsMedicineRepository
                .findByCabinet_CabinetIdAndNameIgnoreCase(cabinetId, medicineDraft.getName().trim())
            .orElseThrow(() -> new RuntimeException("Không thể tạo thuốc từ OCR"));
    }

    private Map<String, Object> postJson(String path, Map<String, Object> body) {
        HttpHeaders headers = buildHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return exchangeForMap(aiServiceBaseUrl + path, HttpMethod.POST, new HttpEntity<>(body, headers));
    }

    private Map<String, Object> exchangeForMap(String url, HttpMethod method, HttpEntity<?> entity) {
        ResponseEntity<Map> response = restTemplate.exchange(url, method, entity, Map.class);
        return response.getBody() != null ? response.getBody() : new LinkedHashMap<>();
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Token", aiInternalToken);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        return headers;
    }

    private ByteArrayResource createAudioResource(MultipartFile audio) {
        try {
            return new ByteArrayResource(audio.getBytes()) {
                @Override
                public String getFilename() {
                    return audio.getOriginalFilename() != null ? audio.getOriginalFilename() : "voice-input.wav";
                }
            };
        } catch (IOException e) {
            throw new RuntimeException("Không thể đọc file audio", e);
        }
    }

    private String writeContextAsJson(Map<String, Object> context) {
        try {
            return objectMapper.writeValueAsString(context);
        } catch (Exception e) {
            throw new RuntimeException("Không thể mã hóa AI context", e);
        }
    }

    private LocalDate parsePrescriptionDate(String rawDate) {
        if (rawDate == null || rawDate.isBlank()) {
            return LocalDate.now();
        }

        List<DateTimeFormatter> formatters = List.of(
                DateTimeFormatter.ISO_LOCAL_DATE,
                DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                DateTimeFormatter.ofPattern("d/M/yyyy")
        );

        for (DateTimeFormatter formatter : formatters) {
            try {
                return LocalDate.parse(rawDate.trim(), formatter);
            } catch (DateTimeParseException ignored) {
            }
        }

        return LocalDate.now();
    }

    private LocalDate parseEndDate(LocalDate startDate, String rawDuration) {
        if (rawDuration == null || rawDuration.isBlank()) {
            return startDate.plusDays(6);
        }

        Matcher matcher = FIRST_INTEGER_PATTERN.matcher(rawDuration);
        if (matcher.find()) {
            int days = Math.max(1, Integer.parseInt(matcher.group(1)));
            return startDate.plusDays(days - 1L);
        }

        return startDate.plusDays(6);
    }

    private String defaultValue(String value, String fallback) {
        return value != null && !value.isBlank() ? value : fallback;
    }
}

