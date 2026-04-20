package com.carenest.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp"
    );
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.upload.base-url:http://10.0.2.2:8080}")
    private String baseUrl;

    public String storeAvatar(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File không được để trống");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Ảnh không được lớn hơn 5MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP");
        }

        String extension = resolveExtension(contentType, file.getOriginalFilename());
        String filename = UUID.randomUUID() + extension;

        Path avatarDir = Paths.get(uploadDir, "avatars");
        Files.createDirectories(avatarDir);

        Path dest = avatarDir.resolve(filename);
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
        }

        return baseUrl + "/uploads/avatars/" + filename;
    }

    public void deleteByUrl(String url) {
        if (url == null || !url.startsWith(baseUrl + "/uploads/")) return;
        String relative = url.substring((baseUrl + "/uploads/").length());
        Path file = Paths.get(uploadDir, relative);
        try {
            Files.deleteIfExists(file);
        } catch (IOException ignored) {}
    }

    private String resolveExtension(String contentType, String originalFilename) {
        if (originalFilename != null) {
            int dot = originalFilename.lastIndexOf('.');
            if (dot >= 0) return originalFilename.substring(dot).toLowerCase();
        }
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }
}
