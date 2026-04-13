package com.carenest.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

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

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 255, message = "Họ tên tối đa 255 ký tự")
    @Column(name = "full_name", length = 255)
    private String fullName;

    @Past(message = "Ngày sinh phải là ngày trong quá khứ")
    @Column(name = "birthday")
    private LocalDate birthday;

    @Size(max = 50, message = "Giới tính tối đa 50 ký tự")
    @Column(name = "gender", length = 50)
    private String gender;

    @Size(max = 10, message = "Nhóm máu tối đa 10 ký tự")
    @Column(name = "blood_type", length = 10)
    private String bloodType;

    @Column(name = "medical_history", columnDefinition = "TEXT")
    private String medicalHistory;

    @Column(name = "allergy", columnDefinition = "TEXT")
    private String allergy;

    @DecimalMin(value = "0.0", inclusive = false, message = "Chiều cao phải lớn hơn 0")
    @Digits(integer = 5, fraction = 2, message = "Chiều cao không hợp lệ")
    @Column(name = "height")
    private BigDecimal height;

    @DecimalMin(value = "0.0", inclusive = false, message = "Cân nặng phải lớn hơn 0")
    @Digits(integer = 5, fraction = 2, message = "Cân nặng không hợp lệ")
    @Column(name = "weight")
    private BigDecimal weight;

    @OneToOne(mappedBy = "profile")
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
