package com.carenest.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class AiVoiceRequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(AiVoiceRequestLoggingFilter.class);

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path == null || !path.startsWith("/api/v1/ai/voice/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        long start = System.currentTimeMillis();
        String method = request.getMethod();
        String path = request.getRequestURI();
        String contentType = request.getContentType();
        String accept = request.getHeader("Accept");

        filterChain.doFilter(request, response);

        long elapsed = System.currentTimeMillis() - start;
        int status = response.getStatus();

        if (status >= 400) {
            log.warn(
                    "AI voice request failed: method={}, path={}, status={}, contentType={}, accept={}, elapsedMs={}",
                    method,
                    path,
                    status,
                    contentType,
                    accept,
                    elapsed
            );
            return;
        }

        log.info(
                "AI voice request ok: method={}, path={}, status={}, elapsedMs={}",
                method,
                path,
                status,
                elapsed
        );
    }
}