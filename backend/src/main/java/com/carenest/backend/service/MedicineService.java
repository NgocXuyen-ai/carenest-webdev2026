package com.carenest.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.carenest.backend.dto.medicine.CreateMedicineRequest;
import com.carenest.backend.dto.medicine.CreateMedicineScheduleRequest;
import com.carenest.backend.dto.medicine.DailyMedicineScheduleResponse;
import com.carenest.backend.dto.medicine.MedicineDoseResponse;
import com.carenest.backend.dto.medicine.MedicineDoseSectionResponse;
import com.carenest.backend.dto.medicine.MedicineOptionResponse;
import com.carenest.backend.dto.medicine.MedicineResponse;
import com.carenest.backend.dto.medicine.MedicineScheduleFormResponse;
import com.carenest.backend.dto.medicine.MedicineScheduleResponse;
import com.carenest.backend.dto.medicine.ProfileOptionResponse;
import com.carenest.backend.dto.medicine.TakeMedicineDoseRequest;
import com.carenest.backend.model.DetailsMedicine;
import com.carenest.backend.model.FamilyMedicineCabinet;
import com.carenest.backend.model.FamilyRelationship;
import com.carenest.backend.model.HealthProfile;
import com.carenest.backend.model.MedicineDoseStatus;
import com.carenest.backend.model.MedicineSchedule;
import com.carenest.backend.model.enums.MedicineSession;
import com.carenest.backend.repository.CabinetRepository;
import com.carenest.backend.repository.DetailsMedicineRepository;
import com.carenest.backend.repository.FamilyRelationshipRepository;
import com.carenest.backend.repository.HealthProfileRepository;
import com.carenest.backend.repository.MedicineDoseStatusRepository;
import com.carenest.backend.repository.MedicineScheduleRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class MedicineService {
    public final MedicineScheduleRepository medicineScheduleRepository;
    public final HealthProfileRepository healthProfileRepository;
    public final DetailsMedicineRepository detailsMedicineRepository;
    public final CabinetRepository cabinetRepository;
    public final FamilyRelationshipRepository familyRelationshipRepository;
    public final MedicineDoseStatusRepository medicineDoseStatusRepository;

    public MedicineService(
        MedicineScheduleRepository medicineScheduleRepository,
        HealthProfileRepository healthProfileRepository,
        DetailsMedicineRepository detailsMedicineRepository,
        CabinetRepository cabinetRepository,
        FamilyRelationshipRepository familyRelationshipRepository,
        MedicineDoseStatusRepository medicineDoseStatusRepository
    ){
        this.medicineScheduleRepository = medicineScheduleRepository;
        this.healthProfileRepository = healthProfileRepository;
        this.detailsMedicineRepository = detailsMedicineRepository;
        this.cabinetRepository = cabinetRepository;
        this.familyRelationshipRepository = familyRelationshipRepository;
        this.medicineDoseStatusRepository = medicineDoseStatusRepository;
    }

    public MedicineScheduleFormResponse getFormData(Integer currentUserId) {

    // ===== lấy profiles =====
        List<ProfileOptionResponse> profiles = healthProfileRepository
                .findAll()
                .stream()
                .filter(p -> p.getUser() != null && currentUserId.equals(p.getUser().getUserId()))
                .map(p -> new ProfileOptionResponse(
                        p.getProfile(),
                        p.getFullName()
                ))
                .toList();

        // ===== lấy medicine từ cabinet =====
        FamilyMedicineCabinet cabinet = getMyCabinet(currentUserId);

        List<MedicineOptionResponse> medicines = detailsMedicineRepository
                .findByCabinet_CabinetIdOrderByExpiryDateAsc(cabinet.getCabinetId())
                .stream()
                .map(m -> new MedicineOptionResponse(
                        m.getMedicineId(),
                        m.getName(),
                        m.getQuantity(),
                        m.getUnit(),
                        m.getCabinet().getCabinetId(),
                        m.getCabinet().getName()
                ))
                .toList();

        return MedicineScheduleFormResponse.builder()
                .profiles(profiles)
                .medicines(medicines)
                .build();
    }

    public void createMedicineSchedule(CreateMedicineScheduleRequest request, Integer currentUserId) {
        HealthProfile profile = healthProfileRepository.findById(request.getProfile())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy profile"));

        DetailsMedicine medicine = detailsMedicineRepository.findById(request.getMedicineId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thuốc"));

        MedicineSchedule schedule = new MedicineSchedule();
        schedule.setProfile(profile);
        schedule.setMedicine(medicine);
        schedule.setMedicineName(medicine.getName());
        schedule.setDosage(request.getDosage());
        schedule.setFrequency(request.getFrequency());
        schedule.setNote(request.getNote());
        schedule.setIsTaken(false);
        schedule.setStartDate(request.getStartDate());
        schedule.setEndDate(request.getEndDate());

        List<MedicineSession> sessions = mapFrequencyToSessions(request.getFrequency());

        LocalDate startDate = request.getStartDate();
        LocalDate endDate = request.getEndDate() != null ? request.getEndDate() : request.getStartDate();

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            for (MedicineSession session : sessions) {
                MedicineDoseStatus doseStatus = new MedicineDoseStatus();
                doseStatus.setDoseDate(date);
                doseStatus.setSession(session);
                doseStatus.setIsTaken(false);
                doseStatus.setTakenAt(null);
                doseStatus.setNote(null);

                schedule.addDoseStatus(doseStatus);
            }
        }

        medicineScheduleRepository.save(schedule);
    }

    private List<MedicineSession> mapFrequencyToSessions(Integer frequency) {
        if (frequency == null || frequency <= 0) {
            return List.of();
        }
    
        return switch (frequency) {
            case 1 -> List.of(MedicineSession.MORNING);
            case 2 -> List.of(MedicineSession.MORNING, MedicineSession.EVENING);
            case 3 -> List.of(MedicineSession.MORNING, MedicineSession.NOON, MedicineSession.EVENING);
            default -> List.of(
                    MedicineSession.MORNING,
                    MedicineSession.NOON,
                    MedicineSession.EVENING
            );
        };
    }

    public List<MedicineScheduleResponse> getMedicineSchedules(Integer profileId) {
        HealthProfile profile = healthProfileRepository.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy profile"));

        return medicineScheduleRepository
                .findByProfile_ProfileOrderByStartDateAsc(profile.getProfile())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private MedicineScheduleResponse mapToResponse(MedicineSchedule m) {
        List<MedicineSession> sessions = m.getDoseStatuses()
                .stream()
                .map(MedicineDoseStatus::getSession)
                .distinct()
                .sorted()
                .toList();
    
        return MedicineScheduleResponse.builder()
                .scheduleId(m.getScheduleId())
                .profileName(m.getProfile().getFullName())
                .medicineName(m.getMedicineName())
                .dosage(m.getDosage())
                .frequency(m.getFrequency())
                .sessions(sessions)
                .note(m.getNote())
                .startDate(m.getStartDate())
                .endDate(m.getEndDate())
                .build();
    }

    public FamilyMedicineCabinet getMyCabinet(Integer currentUserId) {
        HealthProfile profile = healthProfileRepository.findByUser_UserId(currentUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy profile"));

        FamilyRelationship rel = familyRelationshipRepository
                .findByProfile_Profile(profile.getProfile())
                .orElseThrow(() -> new RuntimeException("Bạn chưa thuộc family"));

        return cabinetRepository.findByFamily_FamilyId(rel.getFamily().getFamilyId())
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tủ thuốc"));
    }

    public void createMedicine(Integer currentUserId, CreateMedicineRequest request) {
        FamilyMedicineCabinet cabinet = getMyCabinet(currentUserId);

        if (detailsMedicineRepository.existsByCabinet_CabinetIdAndName(cabinet.getCabinetId(), request.getName())) {
            throw new RuntimeException("Thuốc đã tồn tại trong tủ thuốc");
        }

        DetailsMedicine medicine = new DetailsMedicine();
        medicine.setCabinet(cabinet);
        medicine.setName(request.getName());
        medicine.setQuantity(request.getQuantity());
        medicine.setUnit(request.getUnit());
        medicine.setExpiryDate(request.getExpiryDate());

        detailsMedicineRepository.save(medicine);
    }

    public List<MedicineResponse> getMyMedicines(Integer currentUserId) {
        FamilyMedicineCabinet cabinet = getMyCabinet(currentUserId);

        return detailsMedicineRepository.findByCabinet_CabinetIdOrderByExpiryDateAsc(cabinet.getCabinetId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public MedicineResponse getMedicineDetail(Integer currentUserId, Integer medicineId) {
        FamilyMedicineCabinet cabinet = getMyCabinet(currentUserId);

        DetailsMedicine medicine = detailsMedicineRepository
                .findByMedicineIdAndCabinet_CabinetId(medicineId, cabinet.getCabinetId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thuốc"));

        return mapToResponse(medicine);
    }

    private MedicineResponse mapToResponse(DetailsMedicine medicine) {
        return MedicineResponse.builder()
                .medicineId(medicine.getMedicineId())
                .name(medicine.getName())
                .quantity(medicine.getQuantity())
                .unit(medicine.getUnit())
                .expiryDate(medicine.getExpiryDate())
                .status(getStatus(medicine))
                .build();
    }

    private String getStatus(DetailsMedicine medicine) {
        if (medicine.getQuantity() != null && medicine.getQuantity() == 0) {
            return "OUT_OF_STOCK";
        }
        if (medicine.getExpiryDate() != null) {
            if (medicine.getExpiryDate().isBefore(LocalDate.now())) {
                return "EXPIRED";
            }
            long days = LocalDate.now().until(medicine.getExpiryDate()).getDays();
            if (days <= 30) {
                return "LOW_STOCK";
            }
        }
        return "STABLE";
    }

    public void deleteMedicine(Integer currentUserId, Integer medicineId) {
        FamilyMedicineCabinet cabinet = getMyCabinet(currentUserId);
    
        DetailsMedicine medicine = detailsMedicineRepository
                .findByMedicineIdAndCabinet_CabinetId(medicineId, cabinet.getCabinetId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thuốc"));
    
        if (medicineScheduleRepository.existsByMedicine_MedicineId(medicineId)) {
            throw new RuntimeException("Không thể xóa thuốc vì đang được dùng trong lịch uống thuốc");
        }
    
        detailsMedicineRepository.delete(medicine);
    }

    public DailyMedicineScheduleResponse getDailySchedule(
            Integer profileId,
            LocalDate date,
            Integer currentUserId
    ) {
        HealthProfile profile = healthProfileRepository.findById(profileId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy profile"));

        List<MedicineDoseStatus> doseStatuses =
                medicineDoseStatusRepository.findDailyDoseStatuses(profileId, date);

        Map<MedicineSession, List<MedicineDoseStatus>> grouped = doseStatuses.stream()
                .collect(Collectors.groupingBy(MedicineDoseStatus::getSession));

                List<MedicineDoseSectionResponse> sections = grouped.entrySet().stream()
                .map(entry -> {
                    MedicineSession session = entry.getKey();
        
                    return MedicineDoseSectionResponse.builder()
                            .session(session) // MORNING, NOON, EVENING
                            .items(entry.getValue()
                                    .stream()
                                    .map(this::mapDoseItem)
                                    .toList())
                            .build();
                })
                .toList();

        return DailyMedicineScheduleResponse.builder()
                .profileName(profile.getFullName())
                .date(date)
                .sections(sections)
                .build();
    }

    private MedicineDoseResponse mapDoseItem(MedicineDoseStatus doseStatus) {
        return MedicineDoseResponse.builder()
                .doseId(doseStatus.getDoseId())
                .medicineName(doseStatus.getSchedule().getMedicineName())
                .dosage(doseStatus.getSchedule().getDosage())
                .note(doseStatus.getNote() != null
                        ? doseStatus.getNote()
                        : doseStatus.getSchedule().getNote())
                .isTaken(Boolean.TRUE.equals(doseStatus.getIsTaken()))
                .build();
    }
    
    public void takeDose(TakeMedicineDoseRequest request, Integer userId) {

        MedicineDoseStatus dose = this.medicineDoseStatusRepository.findById(request.getDoseId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dose"));

        boolean taken = Boolean.TRUE.equals(request.getIsTaken());

        dose.setIsTaken(taken);

        if (taken) {
            dose.setTakenAt(LocalDateTime.now());
        } else {
            dose.setTakenAt(null);
        }
        dose.setNote(request.getNote());

        medicineDoseStatusRepository.save(dose);
    }

    public void deleteMedicineSchedule(Integer scheduleId, Integer currentUserId) {

        MedicineSchedule schedule = medicineScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch thuốc"));
    
        // check quyền đơn giản
        if (!schedule.getProfile().getUser().getUserId().equals(currentUserId)) {
            throw new RuntimeException("Bạn không có quyền xóa");
        }
    
        medicineScheduleRepository.delete(schedule);
    }
}