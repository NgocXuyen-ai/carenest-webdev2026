package com.carenest.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.carenest.backend.model.HealthProfile;
import com.carenest.backend.model.User;
@Repository
public interface HealthProfileRepository extends JpaRepository<HealthProfile, Integer> {
    Optional<HealthProfile> findFirstByUser_UserIdOrderByProfileAsc(Integer userId);
    List<HealthProfile> findByUserUserId(Integer userId);
    Optional<HealthProfile> findById(Integer id);
    Optional<User> findByUser_Email(String email);
}
