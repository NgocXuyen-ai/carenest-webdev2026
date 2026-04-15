package com.carenest.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.carenest.backend.model.enums.BloodType;
import com.carenest.backend.model.enums.Gender;

@Entity
@Table(name = "health_profile")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class HealthProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer profileId;

    @NotNull(message = "User không được để trống")
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank(message = "Tên không được để trống")
    @Column(name = "full_name", length = 255)
    private String fullName;

    @Column(name = "birthday")
    private LocalDate birthday;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    private Gender gender;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "blood_type")
    private BloodType bloodType;

    @Column(name = "medical_history", columnDefinition = "TEXT")
    private String medicalHistory;

    @Column(name = "allergy", columnDefinition = "TEXT")
    private String allergy;

    @Column(name = "height")
    private BigDecimal height;

    @Column(name = "weight")
    private BigDecimal weight;

    @Column(name = "emergency_contact_phone")
    private String emergencyContactPhone;

    @OneToOne(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    private FamilyRelationship familyRelationship;

    @OneToMany(mappedBy = "profile")
    private List<MedicineSchedule> medicineSchedules = new ArrayList<>();

    @OneToMany(mappedBy = "profile")
    private List<Appointment> appointments = new ArrayList<>();

    @OneToMany(mappedBy = "profile")
    private List<Vaccination> vaccinations = new ArrayList<>();

    @OneToMany(mappedBy = "profile")
    private List<Notification> notifications = new ArrayList<>();

    @OneToMany(mappedBy = "profile")
    private List<GrowthLog> growthLogs = new ArrayList<>();

    @OneToMany(mappedBy = "profile")
    private List<OcrSession> ocrSessions = new ArrayList<>();
}
