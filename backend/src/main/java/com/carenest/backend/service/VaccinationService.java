package com.carenest.backend.service;

import com.carenest.backend.dto.vaccination.*;
import com.carenest.backend.model.HealthProfile;
import com.carenest.backend.model.Vaccination;
import com.carenest.backend.model.enums.VaccinationStatus;
import com.carenest.backend.repository.HealthProfileRepository;
import com.carenest.backend.repository.VaccinationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class VaccinationService {

    private final VaccinationRepository vaccinationRepository;
    private final HealthProfileRepository healthProfileRepository;

    public VaccinationService(VaccinationRepository vaccinationRepository, HealthProfileRepository healthProfileRepository) {
        this.vaccinationRepository = vaccinationRepository;
        this.healthProfileRepository = healthProfileRepository;
    }

    public List<VaccinationTrackerResponse> getTrackerData(Integer profileId) {
        HealthProfile profile = healthProfileRepository.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ sức khỏe của bé"));

        List<Vaccination> vaccinations = vaccinationRepository.findByProfileOrderByDateGivenAscPlannedDateAsc(profile);

        Map<String, List<VaccinationResponse>> groupedData = new LinkedHashMap<>();

        for (Vaccination v : vaccinations) {
            LocalDate targetDate = (v.getDateGiven() != null) ? v.getDateGiven() : v.getPlannedDate();
            String stage = calculateAgeStage(profile.getBirthday(), targetDate);

            VaccinationResponse res = VaccinationResponse.builder()
                    .vaccineLogId(v.getVaccineLogId())
                    .profileId(profile.getProfile())
                    .fullName(profile.getFullName())
                    .vaccineName(v.getVaccineName())
                    .doseNumber(v.getDoseNumber())
                    .dateGiven(v.getDateGiven())
                    .plannedDate(v.getPlannedDate())
                    .clinicName(v.getClinicName())
                    .status(v.getStatus())
                    .build();

            groupedData.computeIfAbsent(stage, k -> new ArrayList<>()).add(res);
        }

        return groupedData.entrySet().stream()
                .map(entry -> new VaccinationTrackerResponse(
                        entry.getKey(), 
                        getStageDescription(entry.getKey()), 
                        entry.getValue()))
                .collect(Collectors.toList());
    }

    /**
     * Thêm bản ghi tiêm chủng mới (Giao diện Add Vaccination Log)
     */
    @Transactional
    public void addVaccination(Integer profileId, CreateVaccinationRequest request) {
        HealthProfile profile = healthProfileRepository.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ của bé"));

        Vaccination v = new Vaccination();
        v.setProfile(profile);
        v.setVaccineName(request.getVaccineName());
        v.setDoseNumber(request.getDoseNumber());
        v.setDateGiven(request.getDateGiven());
        v.setPlannedDate(request.getPlannedDate());
        v.setClinicName(request.getClinicName());
        
        if (request.getDateGiven() != null) {
            v.setStatus(VaccinationStatus.DONE);
        } else {
            v.setStatus(VaccinationStatus.PLANNED);
        }

        vaccinationRepository.save(v);
    }

    private String calculateAgeStage(LocalDate birthday, LocalDate targetDate) {
        if (birthday == null || targetDate == null) return "Khác";
        Period p = Period.between(birthday, targetDate);
        int totalMonths = p.getYears() * 12 + p.getMonths();
        
        if (totalMonths == 0) return "Sơ sinh";
        return totalMonths + " tháng tuổi";
    }

    private String getStageDescription(String stage) {
        if (stage.equals("Sơ sinh")) return "Giai đoạn đầu tiên sau khi chào đời";
        if (stage.contains("2 tháng")) return "Sắp tới 3 mũi quan trọng";
        if (stage.contains("6 tháng")) return "Kế hoạch tương lai";
        return "Lịch trình tiêm chủng định kỳ";
    }
}