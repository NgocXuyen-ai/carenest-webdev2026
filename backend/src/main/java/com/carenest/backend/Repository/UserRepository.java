package com.carenest.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import com.carenest.backend.model.User;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUserId(@Param("userId") Integer userId);
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
}
