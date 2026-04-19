package com.carenest.backend.repository;

import com.carenest.backend.model.Vaccination;
import com.carenest.backend.model.enums.VaccinationStatus;
import com.carenest.backend.model.HealthProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface VaccinationRepository extends JpaRepository<Vaccination, Integer> {
    // Lấy danh sách tiêm chủng của bé, sắp xếp theo ngày tiêm/ngày hẹn tăng dần
    List<Vaccination> findByProfileOrderByDateGivenAscPlannedDateAsc(HealthProfile profile);
    List<Vaccination> findByPlannedDateBetweenAndStatus(
            LocalDate start,
            LocalDate end,
            VaccinationStatus status
    );
}
