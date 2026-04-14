package com.carenest.backend.security;

import java.util.Collections;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.carenest.backend.service.UserService;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserService userService;

    public CustomUserDetailsService(UserService userService) {
        this.userService = userService;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        com.carenest.backend.model.User myUser = userService.findUserByEmail(username);
        
        return new org.springframework.security.core.userdetails.User(
                myUser.getEmail(),
                myUser.getPasswordHash(),
                Collections.emptyList()
        );
    }
}
