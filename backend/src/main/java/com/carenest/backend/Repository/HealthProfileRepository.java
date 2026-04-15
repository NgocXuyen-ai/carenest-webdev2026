package com.carenest.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.carenest.backend.model.HealthProfile;
import com.carenest.backend.model.User;

public interface HealthProfileRepository extends JpaRepository<HealthProfile, Integer> {
    Optional<HealthProfile> findByUser_UserId(Integer userId);
    Optional<User> findByUser_Email(String email);
}
