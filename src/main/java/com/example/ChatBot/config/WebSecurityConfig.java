package com.example.ChatBot.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebSecurityConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/**")
                // Allow localhost for development + free hosting platforms
                .allowedOriginPatterns(
                    "http://localhost:3000",
                    "http://localhost:8080",
                    "http://192.168.*.*:3000",
                    "http://10.*.*.*:3000",
                    "https://*.onrender.com",
                    "https://*.vercel.app",
                    "https://*.railway.app",
                    "https://*.netlify.app"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
