package com.carenest.backend.exception;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.carenest.backend.helper.ApiResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(
        MethodArgumentNotValidException ex) {

        Map<String, Object> errors = new HashMap<>();
        var fieldError = ex.getBindingResult().getFieldErrors().get(0);

        String fieldName = fieldError.getField();
        String errorMessage = fieldError.getDefaultMessage();
        errors.put(fieldName, null);
    
        return ApiResponse.error(
                HttpStatus.BAD_REQUEST,
                errorMessage,
                "400"
        );  
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Object>> handleRuntimeException(RuntimeException ex) {
        return ApiResponse.error(HttpStatus.BAD_REQUEST, ex.getMessage(), null, "400");
    }
}
