package com.example.ChatBot.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.validation.ConstraintViolationException;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handle validation errors for WebSocket messages
     */
    @MessageExceptionHandler
    @SendToUser("/queue/errors")
    public Map<String, String> handleValidationException(MethodArgumentNotValidException ex) {
        logger.error("Validation error in WebSocket message: {}", ex.getMessage());
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );
        
        return errors;
    }

    /**
     * Handle constraint violation exceptions
     */
    @MessageExceptionHandler
    @SendToUser("/queue/errors")
    public Map<String, String> handleConstraintViolation(ConstraintViolationException ex) {
        logger.error("Constraint violation: {}", ex.getMessage());
        
        Map<String, String> errors = new HashMap<>();
        errors.put("error", "Validation failed: " + ex.getMessage());
        
        return errors;
    }

    /**
     * Handle generic exceptions in WebSocket
     */
    @MessageExceptionHandler
    @SendToUser("/queue/errors")
    public Map<String, String> handleException(Exception ex) {
        logger.error("Error processing WebSocket message", ex);
        
        Map<String, String> error = new HashMap<>();
        error.put("error", "An error occurred while processing your message");
        error.put("message", ex.getMessage());
        
        return error;
    }

    /**
     * Handle REST validation errors (if REST endpoints are added)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseBody
    public Map<String, Object> handleRestValidationException(MethodArgumentNotValidException ex) {
        logger.error("REST validation error: {}", ex.getMessage());
        
        Map<String, Object> response = new HashMap<>();
        Map<String, String> errors = new HashMap<>();
        
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );
        
        response.put("status", "error");
        response.put("errors", errors);
        
        return response;
    }

    /**
     * Handle bind exceptions
     */
    @ExceptionHandler(BindException.class)
    @ResponseBody
    public Map<String, Object> handleBindException(BindException ex) {
        logger.error("Binding error: {}", ex.getMessage());
        
        Map<String, Object> response = new HashMap<>();
        Map<String, String> errors = new HashMap<>();
        
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );
        
        response.put("status", "error");
        response.put("errors", errors);
        
        return response;
    }
}
