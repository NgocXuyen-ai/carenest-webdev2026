package com.carenest.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.carenest.backend.model.FamilyMedicineCabinet;
@Repository
public interface CabinetRepository extends JpaRepository<FamilyMedicineCabinet, Integer> {
    Optional<FamilyMedicineCabinet> findByFamily_FamilyId(Integer familyId);
}
