package com.carenest.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.carenest.backend.dto.RegisterRequest;
import com.carenest.backend.model.User;
import com.carenest.backend.Repository.UserRepository;

@Service
public class UserService {
    public final UserRepository userRepository;
    public final PasswordEncoder passwordEncoder;
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder){
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User register(RegisterRequest request){
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Password không khớp");
        }
    
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã tồn tại");
        }
    
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    
        return userRepository.save(user);
    }

    public List<User> getAllUsers(){
        List<User> userList = this.userRepository.findAll();
        return userList;
    }

    public User findUserByEmail(String email){
        Optional<User> userOpt = this.userRepository.findByEmail(email);
        if (!userOpt.isPresent())
			return null;
		return userOpt.get();
    }
}
