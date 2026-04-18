package com.carenest.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.carenest.backend.model.FamilyRelationship;
@Repository
public interface FamilyRelationshipRepository extends JpaRepository<FamilyRelationship, Integer> {
    Optional<FamilyRelationship> findByProfile_Profile(Integer profileId);

    List<FamilyRelationship> findAllByFamily_FamilyId(Integer familyId);
    boolean existsByProfile_ProfileAndFamily_FamilyId(Integer profileId, Integer familyId);
    Optional<FamilyRelationship> findByProfile_ProfileAndFamily_FamilyId(Integer profileId, Integer familyId);
}
