package com.carenest.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.carenest.backend.model.FamilyRelationship;

public interface FamilyRelationshipRepository extends JpaRepository<FamilyRelationship, Integer> {
    Optional<FamilyRelationship> findByProfile_ProfileId(Integer profileId);

    List<FamilyRelationship> findAllByFamily_FamilyId(Integer familyId);
    boolean existsByProfile_ProfileIdAndFamily_FamilyId(Integer profileId, Integer familyId);
    Optional<FamilyRelationship> findByProfile_ProfileIdAndFamily_FamilyId(Integer profileId, Integer familyId);
}
