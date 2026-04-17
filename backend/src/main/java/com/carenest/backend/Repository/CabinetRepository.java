package com.carenest.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.carenest.backend.model.FamilyMedicineCabinet;

public interface CabinetRepository extends JpaRepository<FamilyMedicineCabinet, Integer> {
    Optional<FamilyMedicineCabinet> findByFamily_FamilyId(Integer familyId);
}
