package com.carenest.backend.service;

import com.carenest.backend.dto.family.CreateFamilyMemberProfileRequest;
import com.carenest.backend.dto.family.CreateFamilyRequest;
import com.carenest.backend.dto.family.FamilyInvitationResponse;
import com.carenest.backend.dto.family.FamilyJoinCodeResponse;
import com.carenest.backend.dto.family.InviteMemberRequest;
import com.carenest.backend.dto.family.JoinFamilyByCodeRequest;
import com.carenest.backend.dto.family.MyFamilyResponse;
import com.carenest.backend.dto.family.ReceivedInvitationResponse;
import com.carenest.backend.dto.family.SentInvitationResponse;
import com.carenest.backend.dto.profile.CreateHealthProfileRequest;
import com.carenest.backend.dto.profile.FamilyMemberSummaryResponse;
import com.carenest.backend.dto.profile.ProfileDetailsResponse;
import com.carenest.backend.dto.profile.UpdateHealthProfileRequest;
import com.carenest.backend.model.Family;
import com.carenest.backend.model.FamilyInvitation;
import com.carenest.backend.model.FamilyMedicineCabinet;
import com.carenest.backend.model.FamilyRelationship;
import com.carenest.backend.model.HealthProfile;
import com.carenest.backend.model.User;
import com.carenest.backend.model.enums.FamilyRole;
import com.carenest.backend.model.enums.InvitationStatus;
import com.carenest.backend.repository.CabinetRepository;
import com.carenest.backend.repository.FamilyInvitationRepository;
import com.carenest.backend.repository.FamilyRelationshipRepository;
import com.carenest.backend.repository.FamilyRepository;
import com.carenest.backend.repository.HealthProfileRepository;
import com.carenest.backend.repository.UserRepository;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.NotFoundException;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.common.HybridBinarizer;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class FamilyService {
    private static final int JOIN_CODE_LENGTH = 8;
    private static final String JOIN_LINK_BASE = "https://webdev.eiyuumiru.it.eu.org/join?code=";

    private final FamilyRepository familyRepository;
    private final HealthProfileRepository healthProfileRepository;
    private final FamilyRelationshipRepository familyRelationshipRepository;
    private final UserRepository userRepository;
    private final FamilyInvitationRepository familyInvitationRepository;
    private final CabinetRepository cabinetRepository;

    public FamilyService(FamilyRepository familyRepository,
                         HealthProfileRepository healthProfileRepository,
                         FamilyRelationshipRepository familyRelationshipRepository,
                         UserRepository userRepository,
                         FamilyInvitationRepository familyInvitationRepository,
                         CabinetRepository cabinetRepository) {
        this.familyRepository = familyRepository;
        this.healthProfileRepository = healthProfileRepository;
        this.familyRelationshipRepository = familyRelationshipRepository;
        this.userRepository = userRepository;
        this.familyInvitationRepository = familyInvitationRepository;
        this.cabinetRepository = cabinetRepository;
    }

    public void createFamily(Integer currentUserId, CreateFamilyRequest req) {
        User currentUser = getRequiredUser(currentUserId);
        HealthProfile profile = getPrimaryProfile(currentUserId);

        if (familyRelationshipRepository.findByProfile_Profile(profile.getProfile()).isPresent()) {
            throw new RuntimeException("Ban da thuoc mot family roi");
        }

        Family family = new Family();
        family.setName(req.getName());
        family.setCreatedAt(LocalDate.now());
        family.setOwner(currentUser);

        Family savedFamily = familyRepository.save(family);

        FamilyRelationship relationship = new FamilyRelationship();
        relationship.setFamily(savedFamily);
        relationship.setProfile(profile);
        relationship.setRole(FamilyRole.OWNER);
        relationship.setJoinAt(LocalDate.now());
        familyRelationshipRepository.save(relationship);

        FamilyMedicineCabinet cabinet = new FamilyMedicineCabinet();
        cabinet.setFamily(savedFamily);
        cabinet.setName("Tu thuoc gia dinh");
        cabinetRepository.save(cabinet);
    }

    public void createProfile(Integer currentUserId, CreateHealthProfileRequest req) {
        User user = getRequiredUser(currentUserId);
        healthProfileRepository.findFirstByUser_UserIdOrderByProfileAsc(user.getUserId())
                .ifPresent(existingProfile -> {
                    throw new RuntimeException("Ban da co ho so suc khoe roi");
                });

        HealthProfile profile = new HealthProfile();
        profile.setUser(user);
        profile.setFullName(req.getFullName());
        profile.setBirthday(req.getBirthday());
        profile.setGender(req.getGender());
        profile.setBloodType(req.getBloodType());
        profile.setMedicalHistory(req.getMedicalHistory());
        profile.setAllergy(req.getAllergy());
        profile.setHeight(req.getHeight());
        profile.setWeight(req.getWeight());
        profile.setEmergencyContactPhone(req.getEmergencyContactPhone());
        healthProfileRepository.save(profile);
    }

    public void updateProfile(Integer userId, Integer profileId, UpdateHealthProfileRequest req) {
        HealthProfile profile = healthProfileRepository.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Khong tim thay profile"));

        if (!profile.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Ban khong co quyen cap nhat profile nay");
        }

        profile.setFullName(req.getFullName());
        profile.setBirthday(req.getBirthday());
        profile.setGender(req.getGender());
        profile.setBloodType(req.getBloodType());
        profile.setMedicalHistory(req.getMedicalHistory());
        profile.setAllergy(req.getAllergy());
        profile.setHeight(req.getHeight());
        profile.setWeight(req.getWeight());
        profile.setEmergencyContactPhone(req.getEmergencyContactPhone());
        healthProfileRepository.save(profile);
    }

    public void createDependentProfile(Integer currentUserId, Integer familyId, CreateFamilyMemberProfileRequest req) {
        User currentUser = getRequiredUser(currentUserId);
        Family family = familyRepository.findById(familyId)
                .orElseThrow(() -> new RuntimeException("Khong tim thay family"));

        if (!family.getOwner().getUserId().equals(currentUserId)) {
            throw new RuntimeException("Ban khong phai owner cua family nay");
        }

        HealthProfile profile = new HealthProfile();
        profile.setUser(currentUser);
        profile.setFullName(req.getFullName());
        profile.setBirthday(req.getBirthday());
        profile.setGender(req.getGender());
        profile.setBloodType(req.getBloodType());
        profile.setMedicalHistory(req.getMedicalHistory());
        profile.setAllergy(req.getAllergy());
        profile.setHeight(req.getHeight());
        profile.setWeight(req.getWeight());
        profile.setEmergencyContactPhone(req.getEmergencyContactPhone());
        healthProfileRepository.save(profile);

        FamilyRelationship relationship = new FamilyRelationship();
        relationship.setProfile(profile);
        relationship.setFamily(family);
        relationship.setRole(req.getRole());
        relationship.setJoinAt(LocalDate.now());
        familyRelationshipRepository.save(relationship);
    }

    public MyFamilyResponse getMyFamily(Integer currentUserId) {
        FamilyRelationship relationship = getRequiredFamilyRelationship(currentUserId);
        Family family = relationship.getFamily();

        List<FamilyMemberSummaryResponse> members = familyRelationshipRepository
                .findAllByFamily_FamilyId(family.getFamilyId())
                .stream()
                .map(rel -> {
                    HealthProfile profile = rel.getProfile();
                    return FamilyMemberSummaryResponse.builder()
                            .profileId(profile.getProfile())
                            .fullName(profile.getFullName())
                            .role(rel.getRole())
                            .avatarUrl(profile.getAvatarUrl())
                            .age(calculateAge(profile.getBirthday()))
                            .healthStatus(mapHealthStatus(profile))
                            .build();
                })
                .toList();

        return MyFamilyResponse.builder()
                .familyId(family.getFamilyId())
                .familyName(family.getName())
                .memberCount(members.size())
                .members(members)
                .build();
    }

    public ProfileDetailsResponse getFamilyMemberProfile(Integer currentUserId, Integer targetProfileId) {
        FamilyRelationship myRelationship = getRequiredFamilyRelationship(currentUserId);
        HealthProfile targetProfile = healthProfileRepository.findById(targetProfileId)
                .orElseThrow(() -> new RuntimeException("Khong tim thay ho so suc khoe"));
        FamilyRelationship targetRelationship = familyRelationshipRepository.findByProfile_Profile(targetProfile.getProfile())
                .orElseThrow(() -> new RuntimeException("Nguoi nay chua thuoc family nao"));

        if (!myRelationship.getFamily().getFamilyId().equals(targetRelationship.getFamily().getFamilyId())) {
            throw new RuntimeException("Ban khong co quyen xem ho so nay");
        }

        return ProfileDetailsResponse.builder()
                .profileId(targetProfile.getProfile())
                .fullName(targetProfile.getFullName())
                .birthday(targetProfile.getBirthday())
                .age(calculateAge(targetProfile.getBirthday()))
                .gender(targetProfile.getGender())
                .bloodType(targetProfile.getBloodType())
                .height(targetProfile.getHeight())
                .weight(targetProfile.getWeight())
                .medicalHistory(targetProfile.getMedicalHistory())
                .allergy(targetProfile.getAllergy())
                .healthStatus(mapHealthStatus(targetProfile))
                .build();
    }

    public FamilyInvitationResponse inviteMember(Integer currentUserId, InviteMemberRequest dto) {
        User currentUser = getRequiredUser(currentUserId);
        FamilyRelationship senderRelationship = getRequiredOwnerRelationship(currentUserId);
        Family family = senderRelationship.getFamily();

        String receiverEmail = dto.getReceiverEmail().trim().toLowerCase(Locale.ROOT);
        User receiver = userRepository.findByEmail(receiverEmail)
                .orElseThrow(() -> new RuntimeException("Khong tim thay user"));

        if (receiver.getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Khong the tu moi chinh minh");
        }

        HealthProfile receiverProfile = healthProfileRepository.findFirstByUser_UserIdOrderByProfileAsc(receiver.getUserId())
                .orElseThrow(() -> new RuntimeException("Nguoi nay chua co profile"));

        if (familyRelationshipRepository.existsByProfile_ProfileAndFamily_FamilyId(receiverProfile.getProfile(), family.getFamilyId())) {
            throw new RuntimeException("Da la thanh vien roi");
        }

        if (familyInvitationRepository.existsByReceiver_UserIdAndFamily_FamilyIdAndStatus(
                receiver.getUserId(),
                family.getFamilyId(),
                InvitationStatus.PENDING
        )) {
            throw new RuntimeException("Da co loi moi pending");
        }

        FamilyInvitation invitation = new FamilyInvitation();
        invitation.setSender(currentUser);
        invitation.setReceiver(receiver);
        invitation.setFamily(family);
        invitation.setStatus(InvitationStatus.PENDING);
        invitation.setRole(dto.getRole());
        invitation.setCreatedAt(LocalDateTime.now());

        FamilyInvitation saved = familyInvitationRepository.save(invitation);
        return FamilyInvitationResponse.builder()
                .inviteId(saved.getInviteId())
                .familyId(family.getFamilyId())
                .familyName(family.getName())
                .senderId(currentUser.getUserId())
                .senderEmail(currentUser.getEmail())
                .receiverId(receiver.getUserId())
                .receiverEmail(receiver.getEmail())
                .status(saved.getStatus().name())
                .message("Invite thanh cong")
                .build();
    }

    public List<FamilyInvitationResponse> getMyInvitations(Integer currentUserId) {
        User currentUser = getRequiredUser(currentUserId);
        List<FamilyInvitation> invitations = familyInvitationRepository.findAllByReceiver_UserIdAndStatus(
                currentUser.getUserId(),
                InvitationStatus.PENDING
        );

        return invitations.stream().map(invite -> FamilyInvitationResponse.builder()
                .inviteId(invite.getInviteId())
                .familyId(invite.getFamily().getFamilyId())
                .familyName(invite.getFamily().getName())
                .senderId(invite.getSender().getUserId())
                .senderEmail(invite.getSender().getEmail())
                .receiverId(currentUser.getUserId())
                .receiverEmail(currentUser.getEmail())
                .status(invite.getStatus().name())
                .message("Ban co loi moi tham gia family")
                .build()).toList();
    }

    public List<ReceivedInvitationResponse> getReceivedInvitations(Integer currentUserId) {
        User currentUser = getRequiredUser(currentUserId);
        return familyInvitationRepository.findAllByReceiverAndStatusOrderByCreatedAtDesc(currentUser, InvitationStatus.PENDING)
                .stream()
                .map(invite -> ReceivedInvitationResponse.builder()
                        .inviteId(invite.getInviteId())
                        .familyId(invite.getFamily().getFamilyId())
                        .familyName(invite.getFamily().getName())
                        .senderId(invite.getSender().getUserId())
                        .senderEmail(invite.getSender().getEmail())
                        .status(invite.getStatus().name())
                        .createdAt(invite.getCreatedAt())
                        .build())
                .toList();
    }

    public List<SentInvitationResponse> getSentInvitations(Integer currentUserId) {
        getRequiredOwnerRelationship(currentUserId);
        User currentUser = getRequiredUser(currentUserId);

        return familyInvitationRepository.findAllBySenderOrderByCreatedAtDesc(currentUser)
                .stream()
                .map(invite -> SentInvitationResponse.builder()
                        .inviteId(invite.getInviteId())
                        .familyId(invite.getFamily().getFamilyId())
                        .familyName(invite.getFamily().getName())
                        .receiverId(invite.getReceiver().getUserId())
                        .receiverEmail(invite.getReceiver().getEmail())
                        .status(invite.getStatus().name())
                        .createdAt(invite.getCreatedAt())
                        .build())
                .toList();
    }

    public void acceptInvitation(Integer currentUserId, Integer inviteId) {
        User currentUser = getRequiredUser(currentUserId);
        FamilyInvitation invitation = familyInvitationRepository.findByInviteId_AndReceiver(inviteId, currentUser)
                .orElseThrow(() -> new RuntimeException("Khong tim thay loi moi"));

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new RuntimeException("Loi moi khong con hieu luc");
        }

        HealthProfile profile = getPrimaryProfile(currentUserId);
        familyRelationshipRepository.findByProfile_Profile(profile.getProfile()).ifPresent(existing -> {
            throw new RuntimeException("Ban da thuoc family khac");
        });

        FamilyRelationship relationship = new FamilyRelationship();
        relationship.setProfile(profile);
        relationship.setFamily(invitation.getFamily());
        relationship.setRole(invitation.getRole());
        relationship.setJoinAt(LocalDate.now());
        familyRelationshipRepository.save(relationship);

        invitation.setStatus(InvitationStatus.ACCEPTED);
        familyInvitationRepository.save(invitation);
    }

    public void rejectInvitation(Integer currentUserId, Integer inviteId) {
        User currentUser = getRequiredUser(currentUserId);
        FamilyInvitation invitation = familyInvitationRepository.findByInviteIdAndReceiver_UserId(inviteId, currentUser.getUserId())
                .orElseThrow(() -> new RuntimeException("Khong tim thay loi moi"));

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new RuntimeException("Loi moi khong con hieu luc");
        }

        invitation.setStatus(InvitationStatus.REJECTED);
        familyInvitationRepository.save(invitation);
    }

    public void removeMember(Integer currentUserId, Integer profileId) {
        FamilyRelationship currentRelationship = getRequiredOwnerRelationship(currentUserId);
        Integer familyId = currentRelationship.getFamily().getFamilyId();

        if (currentRelationship.getProfile().getProfile().equals(profileId)) {
            throw new RuntimeException("OWNER khong the tu xoa chinh minh");
        }

        FamilyRelationship targetRelationship = familyRelationshipRepository
                .findByProfile_ProfileAndFamily_FamilyId(profileId, familyId)
                .orElseThrow(() -> new RuntimeException("Khong tim thay thanh vien trong family"));

        if (targetRelationship.getRole() == FamilyRole.OWNER) {
            throw new RuntimeException("Khong the xoa OWNER");
        }

        HealthProfile targetProfile = targetRelationship.getProfile();
        if (targetProfile != null) {
            targetProfile.setFamilyRelationship(null);
        }
        targetRelationship.setProfile(null);
        familyRelationshipRepository.delete(targetRelationship);
        familyRelationshipRepository.flush();
    }

    public FamilyJoinCodeResponse getJoinCode(Integer currentUserId) {
        FamilyRelationship ownerRelationship = getRequiredOwnerRelationship(currentUserId);
        Family family = ownerRelationship.getFamily();
        ensureActiveJoinCode(family);
        familyRepository.save(family);
        return buildJoinCodeResponse(family);
    }

    public FamilyJoinCodeResponse rotateJoinCode(Integer currentUserId) {
        FamilyRelationship ownerRelationship = getRequiredOwnerRelationship(currentUserId);
        Family family = ownerRelationship.getFamily();
        refreshJoinCode(family);
        familyRepository.save(family);
        return buildJoinCodeResponse(family);
    }

    public MyFamilyResponse joinByCode(Integer currentUserId, JoinFamilyByCodeRequest request) {
        HealthProfile profile = getPrimaryProfile(currentUserId);
        familyRelationshipRepository.findByProfile_Profile(profile.getProfile()).ifPresent(existing -> {
            throw new RuntimeException("Ban da thuoc mot family khac");
        });

        Family family = getJoinableFamily(currentUserId, request.getJoinCode());
        FamilyRelationship relationship = buildJoinRelationship(profile, family);
        familyRelationshipRepository.save(relationship);
        return getMyFamily(currentUserId);
    }

    public MyFamilyResponse joinByQr(Integer currentUserId, MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new RuntimeException("Khong tim thay anh QR");
        }

        String qrPayload = decodeQrPayload(image);
        String joinCode = extractJoinCode(qrPayload);
        JoinFamilyByCodeRequest request = new JoinFamilyByCodeRequest();
        request.setJoinCode(joinCode);
        return joinByCode(currentUserId, request);
    }

    private User getRequiredUser(Integer currentUserId) {
        return userRepository.findById(currentUserId)
                .orElseThrow(() -> new UsernameNotFoundException("Khong tim thay user"));
    }

    private HealthProfile getPrimaryProfile(Integer currentUserId) {
        return healthProfileRepository.findFirstByUser_UserIdOrderByProfileAsc(currentUserId)
                .orElseThrow(() -> new RuntimeException("Ban chua co health profile"));
    }

    private FamilyRelationship getRequiredFamilyRelationship(Integer currentUserId) {
        HealthProfile profile = getPrimaryProfile(currentUserId);
        return familyRelationshipRepository.findByProfile_Profile(profile.getProfile())
                .orElseThrow(() -> new RuntimeException("Ban chua thuoc family nao"));
    }

    private FamilyRelationship getRequiredOwnerRelationship(Integer currentUserId) {
        FamilyRelationship relationship = getRequiredFamilyRelationship(currentUserId);
        if (relationship.getRole() != FamilyRole.OWNER) {
            throw new RuntimeException("Chi OWNER moi duoc thuc hien thao tac nay");
        }
        return relationship;
    }

    private FamilyJoinCodeResponse buildJoinCodeResponse(Family family) {
        String joinLink = JOIN_LINK_BASE + family.getJoinCode();
        return FamilyJoinCodeResponse.builder()
                .joinCode(family.getJoinCode())
                .joinLink(joinLink)
                .qrCodeBase64(generateQrCodeBase64(joinLink))
                .expiresAt(family.getJoinCodeExpiresAt())
                .familyId(family.getFamilyId())
                .familyName(family.getName())
                .build();
    }

    private Family getJoinableFamily(Integer currentUserId, String rawJoinCode) {
        String normalizedCode = extractJoinCode(rawJoinCode);
        Family family = familyRepository.findByJoinCode(normalizedCode)
                .orElseThrow(() -> new RuntimeException("Ma tham gia khong hop le"));

        if (family.getJoinCodeExpiresAt() == null || family.getJoinCodeExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Ma tham gia da het han");
        }

        if (family.getOwner().getUserId().equals(currentUserId)) {
            throw new RuntimeException("Ban da la chu family nay");
        }

        return family;
    }

    private FamilyRelationship buildJoinRelationship(HealthProfile profile, Family family) {
        FamilyRelationship relationship = new FamilyRelationship();
        relationship.setProfile(profile);
        relationship.setFamily(family);
        relationship.setRole(FamilyRole.MEMBER);
        relationship.setJoinAt(LocalDate.now());
        return relationship;
    }

    private void ensureActiveJoinCode(Family family) {
        if (family.getJoinCode() == null || family.getJoinCodeExpiresAt() == null || family.getJoinCodeExpiresAt().isBefore(LocalDateTime.now())) {
            refreshJoinCode(family);
        }
    }

    private void refreshJoinCode(Family family) {
        family.setJoinCode(generateJoinCode());
        family.setJoinCodeExpiresAt(LocalDateTime.now().plusHours(24));
    }

    private String generateJoinCode() {
        String joinCode;
        do {
            joinCode = UUID.randomUUID()
                    .toString()
                    .replace("-", "")
                    .substring(0, JOIN_CODE_LENGTH)
                    .toUpperCase(Locale.ROOT);
        } while (familyRepository.findByJoinCode(joinCode).isPresent());
        return joinCode;
    }

    private String generateQrCodeBase64(String payload) {
        try {
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.MARGIN, 1);
            BitMatrix matrix = new QRCodeWriter().encode(payload, com.google.zxing.BarcodeFormat.QR_CODE, 320, 320, hints);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", outputStream);
            return Base64.getEncoder().encodeToString(outputStream.toByteArray());
        } catch (Exception exception) {
            throw new RuntimeException("Khong the tao QR code", exception);
        }
    }

    private String decodeQrPayload(MultipartFile image) {
        try {
            BufferedImage bufferedImage = ImageIO.read(image.getInputStream());
            if (bufferedImage == null) {
                throw new RuntimeException("Anh QR khong hop le");
            }

            BinaryBitmap bitmap = new BinaryBitmap(
                    new HybridBinarizer(new BufferedImageLuminanceSource(bufferedImage))
            );
            return new MultiFormatReader().decode(bitmap).getText();
        } catch (NotFoundException exception) {
            throw new RuntimeException("Khong doc duoc ma QR trong anh");
        } catch (IOException exception) {
            throw new RuntimeException("Khong the doc anh QR", exception);
        }
    }

    private String extractJoinCode(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            throw new RuntimeException("Ma tham gia khong hop le");
        }

        String normalizedValue = rawValue.trim();
        int codeIndex = normalizedValue.indexOf("code=");
        if (codeIndex >= 0) {
            String queryValue = normalizedValue.substring(codeIndex + 5);
            int nextSeparator = queryValue.indexOf('&');
            String code = nextSeparator >= 0 ? queryValue.substring(0, nextSeparator) : queryValue;
            return code.trim().toUpperCase(Locale.ROOT);
        }

        return normalizedValue.toUpperCase(Locale.ROOT);
    }

    private Integer calculateAge(LocalDate birthday) {
        if (birthday == null) {
            return null;
        }
        return Period.between(birthday, LocalDate.now()).getYears();
    }

    private String mapHealthStatus(HealthProfile profile) {
        if (profile.getMedicalHistory() != null && !profile.getMedicalHistory().isBlank()) {
            return "CAN THEO DOI";
        }
        return "SUC KHOE TOT";
    }
}
