package com.carenest.backend.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.carenest.backend.model.User;

public interface UserRepository extends JpaRepository<User, Integer> {
}
