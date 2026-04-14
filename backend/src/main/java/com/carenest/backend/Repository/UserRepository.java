package com.carenest.backend.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.carenest.backend.model.User;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findById(int id);
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
}
