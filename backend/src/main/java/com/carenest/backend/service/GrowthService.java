package com.carenest.backend.service;

import com.carenest.backend.dto.growth.*;
import com.carenest.backend.model.GrowthLog;
import com.carenest.backend.model.HealthProfile;
import com.carenest.backend.repository.GrowthLogRepository;
import com.carenest.backend.repository.HealthProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class GrowthService {

    private final GrowthLogRepository growthLogRepository;
    private final HealthProfileRepository healthProfileRepository;

    public GrowthService(GrowthLogRepository growthLogRepository, HealthProfileRepository healthProfileRepository) {
        this.growthLogRepository = growthLogRepository;
        this.healthProfileRepository = healthProfileRepository;
    }

    public GrowthSummaryResponse getGrowthSummary(Integer profileId) {
        HealthProfile profile = healthProfileRepository.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ sức khỏe"));

        // RÀNG BUỘC 1: Chỉ dành cho người dưới 20 tuổi
        if (profile.getBirthday() == null) {
            throw new RuntimeException("Vui lòng cập nhật ngày sinh để sử dụng tính năng này");
        }
        
        Period agePeriod = Period.between(profile.getBirthday(), LocalDate.now());
        if (agePeriod.getYears() >= 20) {
            throw new RuntimeException("Tính năng theo dõi tăng trưởng chỉ dành cho người dưới 20 tuổi");
        }

        List<GrowthLog> logsAsc = growthLogRepository.findByProfileOrderByRecordDateAsc(profile);
        List<GrowthLog> logsDesc = growthLogRepository.findByProfileOrderByRecordDateDesc(profile);

        GrowthSummaryResponse response = new GrowthSummaryResponse();
        response.setChildName(profile.getFullName());
        
        int totalMonths = agePeriod.getYears() * 12 + agePeriod.getMonths();
        response.setAgeString(totalMonths + " tháng tuổi");
        response.setStatusLabel("Bình thường");

        // RÀNG BUỘC 2: Phải từ 5 lần nhập mới vẽ chart
        if (logsAsc.size() >= 5) {
            response.setCanDrawChart(true);
            response.setWeightChart(logsAsc.stream()
                    .map(log -> new ChartDataPoint(formatLabel(profile.getBirthday(), log.getRecordDate()), log.getWeight()))
                    .collect(Collectors.toList()));

            response.setHeightChart(logsAsc.stream()
                    .map(log -> new ChartDataPoint(formatLabel(profile.getBirthday(), log.getRecordDate()), log.getHeight()))
                    .collect(Collectors.toList()));
        } else {
            response.setCanDrawChart(false);
            response.setChartMessage("Bạn cần nhập ít nhất 5 chỉ số đo (hiện có " + logsAsc.size() + ") để hệ thống vẽ biểu đồ tăng trưởng.");
            response.setWeightChart(new ArrayList<>());
            response.setHeightChart(new ArrayList<>());
        }

        // Lịch sử luôn hiển thị dù có bao nhiêu bản ghi
        response.setHistory(logsDesc.stream()
                .map(log -> GrowthHistoryItem.builder()
                        .date(log.getRecordDate())
                        .weight(log.getWeight())
                        .height(log.getHeight())
                        .note(log.getNote())
                        .build())
                .collect(Collectors.toList()));

        return response;
    }

    @Transactional
    public void addGrowthLog(CreateGrowthLogRequest request) {
        HealthProfile profile = healthProfileRepository.findById(request.getProfileId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ"));

        Period agePeriod = Period.between(profile.getBirthday(), LocalDate.now());
        if (agePeriod.getYears() >= 20) {
            throw new RuntimeException("Không thể thêm dữ liệu tăng trưởng cho người từ 20 tuổi trở lên");
        }

        if (growthLogRepository.existsByProfileAndRecordDate(profile, request.getRecordDate())) {
           throw new RuntimeException("Ngày này đã có dữ liệu rồi");
        }

        GrowthLog log = new GrowthLog();
        log.setProfile(profile);
        log.setWeight(request.getWeight());
        log.setHeight(request.getHeight());
        log.setRecordDate(request.getRecordDate());
        log.setNote(request.getNote());

        growthLogRepository.save(log);

        // Cập nhật thông số mới nhất vào HealthProfile
        profile.setWeight(request.getWeight());
        profile.setHeight(request.getHeight());
        healthProfileRepository.save(profile);
    }

    private String formatLabel(LocalDate birthday, LocalDate recordDate) {
        Period p = Period.between(birthday, recordDate);
        int months = p.getYears() * 12 + p.getMonths();
        return "Tháng " + months;
    }
}