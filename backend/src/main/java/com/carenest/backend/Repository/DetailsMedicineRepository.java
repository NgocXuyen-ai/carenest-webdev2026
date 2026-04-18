package com.carenest.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.carenest.backend.model.DetailsMedicine;
@Repository
public interface DetailsMedicineRepository extends JpaRepository<DetailsMedicine, Integer> {

    Optional<DetailsMedicine> findById(Integer id);
    List<DetailsMedicine> findByCabinet_CabinetIdOrderByExpiryDateAsc(Integer cabinetId);

    Optional<DetailsMedicine> findByMedicineIdAndCabinet_CabinetId(Integer medicineId, Integer cabinetId);

    boolean existsByCabinet_CabinetIdAndName(Integer cabinetId, String name);
}
