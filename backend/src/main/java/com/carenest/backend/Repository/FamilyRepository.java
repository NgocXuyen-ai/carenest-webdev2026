package com.carenest.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.carenest.backend.model.Family;

import java.util.Optional;

@Repository
public interface FamilyRepository extends JpaRepository<Family, Integer> {
    Optional<Family> findByJoinCode(String joinCode);
}
