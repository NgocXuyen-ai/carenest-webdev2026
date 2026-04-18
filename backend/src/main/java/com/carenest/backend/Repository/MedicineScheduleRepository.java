package com.carenest.backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.carenest.backend.model.MedicineSchedule;
@Repository
public interface MedicineScheduleRepository extends JpaRepository<MedicineSchedule, Integer> {

    List<MedicineSchedule> findByProfile_ProfileOrderByStartDateAsc(Integer profileId);
    boolean existsByMedicine_MedicineId(Integer medicineId);

    List<MedicineSchedule> findByProfile_ProfileAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByMedicineNameAsc(
            Integer profile,
            LocalDate date1,
            LocalDate date2
    );

    boolean existsByProfile_ProfileAndMedicine_NameIgnoreCaseAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Integer profile,
            String medicineName,
            LocalDate endDate,
            LocalDate startDate
    );
}
