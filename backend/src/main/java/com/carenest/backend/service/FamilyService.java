package com.carenest.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.List;

import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.carenest.backend.dto.family.CreateFamilyMemberProfileRequest;
import com.carenest.backend.dto.family.CreateFamilyRequest;
import com.carenest.backend.dto.family.FamilyInvitationResponse;
import com.carenest.backend.dto.family.InviteMemberRequest;
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

@Service
public class FamilyService {
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
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user"));

        HealthProfile profile = healthProfileRepository
                .findByUser_UserId(currentUser.getUserId())
                .orElseThrow(() -> new RuntimeException("Hãy nhập đầy đủ thông tin cá nhân trước khi tạo Family"));

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
        cabinet.setFamily(family);
        cabinet.setName("Tủ thuốc gia đình");

        cabinetRepository.save(cabinet);
    }

    public void createProfile(Integer currentUserId, CreateHealthProfileRequest req) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user"));

        healthProfileRepository.findByUser_UserId(user.getUserId())
                .ifPresent(existingProfile -> {
                    throw new RuntimeException("Bạn đã có hồ sơ sức khỏe rồi");
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
                .orElseThrow(() -> new RuntimeException("Không tìm thấy profile"));

        if (!profile.getUser().getUserId().equals(userId)) {
                throw new RuntimeException("Bạn không có quyền cập nhật profile này");
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

    public void createDependentProfile(Integer currentUserId, Integer familyId, CreateFamilyMemberProfileRequest req
    ) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user"));

        Family family = familyRepository.findById(familyId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy family"));

        if (!family.getOwner().getUserId().equals(currentUserId)) {
            throw new RuntimeException("Bạn không phải owner của family này");
        }

        HealthProfile profile = new HealthProfile();
        profile.setUser(currentUser); // profile phụ thuộc, không có account riêng
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
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user"));

        HealthProfile myProfile = healthProfileRepository
                .findByUser_UserId(currentUser.getUserId())
                .orElseThrow(() -> new RuntimeException("Bạn chưa có hồ sơ sức khỏe"));

        FamilyRelationship myRelationship = familyRelationshipRepository
                .findByProfile_Profile(myProfile.getProfile())
                .orElseThrow(() -> new RuntimeException("Bạn chưa thuộc family nào"));

        Family family = myRelationship.getFamily();

        List<FamilyRelationship> relationships =
                familyRelationshipRepository.findAllByFamily_FamilyId(family.getFamilyId());

        List<FamilyMemberSummaryResponse> members = relationships.stream()
                .map(rel -> {
                    HealthProfile profile = rel.getProfile();
    
                    return FamilyMemberSummaryResponse. builder()
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

    private Integer calculateAge(LocalDate birthday) {
        if (birthday == null) {
            return null;
        }
        return Period.between(birthday, LocalDate.now()).getYears();
    }

    public ProfileDetailsResponse getFamilyMemberProfile(Integer currentUserId, Integer targetProfileId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user"));
    
        HealthProfile myProfile = healthProfileRepository
                .findByUser_UserId(currentUser.getUserId())
                .orElseThrow(() -> new RuntimeException("Bạn chưa có hồ sơ sức khỏe"));
    
        FamilyRelationship myRelationship = familyRelationshipRepository
                .findByProfile_Profile(myProfile.getProfile())
                .orElseThrow(() -> new RuntimeException("Bạn chưa thuộc family nào"));
    
        HealthProfile targetProfile = healthProfileRepository.findById(targetProfileId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ sức khỏe"));
    
        FamilyRelationship targetRelationship = familyRelationshipRepository
                .findByProfile_Profile(targetProfile.getProfile())
                .orElseThrow(() -> new RuntimeException("Người này chưa thuộc family nào"));
    
        if (!myRelationship.getFamily().getFamilyId()
                .equals(targetRelationship.getFamily().getFamilyId())) {
            throw new RuntimeException("Bạn không có quyền xem hồ sơ này");
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

    private String mapHealthStatus(HealthProfile profile) {
        if (profile.getMedicalHistory() != null && !profile.getMedicalHistory().isBlank()) {
            return "CẦN THEO DÕI";
        }
        return "SỨC KHỎE TỐT";
    }

    //Mời thành viên
    public FamilyInvitationResponse inviteMember(Integer currentUserId, InviteMemberRequest dto) {

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user"));

        if (dto.getReceiverEmail() == null || dto.getReceiverEmail().trim().isEmpty()) {
            throw new RuntimeException("Email không được để trống");
        }

        String receiverEmail = dto.getReceiverEmail().trim().toLowerCase();

        // 1. Lấy profile của sender
        HealthProfile senderProfile = healthProfileRepository.findByUser_UserId(currentUser.getUserId())
                .orElseThrow(() -> new RuntimeException("Bạn chưa có health profile"));

        // 2. Lấy relationship
        FamilyRelationship senderRelationship = familyRelationshipRepository
                .findByProfile_Profile(senderProfile.getProfile())
                .orElseThrow(() -> new RuntimeException("Bạn chưa thuộc family nào"));

        // 3. Check OWNER
        if (senderRelationship.getRole() != FamilyRole.OWNER) {
                throw new RuntimeException("Chỉ OWNER mới được mời");
        }

        Family family = senderRelationship.getFamily();

        // 4. Tìm receiver
        User receiver = userRepository.findByEmail(receiverEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        if (receiver.getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Không thể tự mời chính mình");
        }

        // 5. Check profile receiver
        HealthProfile receiverProfile = healthProfileRepository
                .findByUser_UserId(receiver.getUserId())
                .orElseThrow(() -> new RuntimeException("Người này chưa có profile"));

        // 6. Check đã là member chưa
        boolean alreadyMember = familyRelationshipRepository
                .existsByProfile_ProfileAndFamily_FamilyId(
                        receiverProfile.getProfile(),
                        family.getFamilyId()
                );

        if (alreadyMember) {
            throw new RuntimeException("Đã là thành viên rồi");
        }

        // 7. Check pending invite
        boolean hasPending = familyInvitationRepository
                .existsByReceiver_UserIdAndFamily_FamilyIdAndStatus(
                        receiver.getUserId(),
                        family.getFamilyId(),
                        InvitationStatus.PENDING
                );

        if (hasPending) {
            throw new RuntimeException("Đã có lời mời pending");
        }

        // 8. Tạo invitation
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
                .message("Invite thành công")
                .build();
    }

    public List<FamilyInvitationResponse> getMyInvitations(Integer currentUserId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user"));
        List<FamilyInvitation> invitations =
                familyInvitationRepository.findAllByReceiver_UserIdAndStatus(
                        currentUser.getUserId(),
                        InvitationStatus.PENDING
                );
    
        return invitations.stream().map(invite -> {

            Family family = invite.getFamily();
        
            User sender = invite.getSender();
        
            return FamilyInvitationResponse.builder()
                    .inviteId(invite.getInviteId())
                    .familyId(family.getFamilyId())
                    .familyName(family.getName())
                    .senderId(sender.getUserId())
                    .senderEmail(sender.getEmail())
                    .receiverId(currentUser.getUserId())
                    .receiverEmail(currentUser.getEmail())
                    .status(invite.getStatus().name())
                    .message("Bạn có lời mời tham gia family")
                    .build();
        
        }).toList();
    }

    public List<ReceivedInvitationResponse> getReceivedInvitations(Integer currentUserId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user"));

        List<FamilyInvitation> invitations = familyInvitationRepository
                .findAllByReceiverAndStatusOrderByCreatedAtDesc(
                        currentUser,
                        InvitationStatus.PENDING
                );

        return invitations.stream().map(invite -> {
            User sender = invite.getSender();

            Family family = invite.getFamily();

            return ReceivedInvitationResponse.builder()
                    .inviteId(invite.getInviteId())
                    .familyId(family.getFamilyId())
                    .familyName(family.getName())
                    .senderId(sender.getUserId())
                    .senderEmail(sender.getEmail())
                    .status(invite.getStatus().name())
                    .createdAt(invite.getCreatedAt())
                    .build();
        }).toList();
    }

    public List<SentInvitationResponse> getSentInvitations(Integer currentUserId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user"));

        HealthProfile senderProfile = healthProfileRepository.findByUser_UserId(currentUser.getUserId())
                .orElseThrow(() -> new RuntimeException("Bạn chưa có health profile"));

        FamilyRelationship relationship = familyRelationshipRepository
                .findByProfile_Profile(senderProfile.getProfile())
                .orElseThrow(() -> new RuntimeException("Bạn chưa thuộc family nào"));

        if (relationship.getRole() != FamilyRole.OWNER) {
            throw new RuntimeException("Chỉ owner mới được xem lời mời đã gửi");
        }

        List<FamilyInvitation> invitations = familyInvitationRepository
                .findAllBySenderOrderByCreatedAtDesc(currentUser);

        return invitations.stream().map(invite -> {
            User receiver = invite.getReceiver();

            Family family = invite.getFamily();

            return SentInvitationResponse.builder()
                    .inviteId(invite.getInviteId())
                    .familyId(family.getFamilyId())
                    .familyName(family.getName())
                    .receiverId(receiver.getUserId())
                    .receiverEmail(receiver.getEmail())
                    .status(invite.getStatus().name())
                    .createdAt(invite.getCreatedAt())
                    .build();
        }).toList();
    }

    public void acceptInvitation(Integer currentUserId, Integer inviteId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user"));

        FamilyInvitation invitation = familyInvitationRepository
                .findByInviteId_AndReceiver(inviteId, currentUser)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lời mời"));

        if (invitation.getStatus() != InvitationStatus.PENDING) {
                throw new RuntimeException("Lời mời không còn hiệu lực");
        }

        HealthProfile profile = healthProfileRepository.findByUser_UserId(currentUser.getUserId())
                .orElseThrow(() -> new RuntimeException("Bạn chưa có health profile"));

        boolean alreadyMember = familyRelationshipRepository
                .existsByProfile_ProfileAndFamily_FamilyId(
                        profile.getProfile(),
                        invitation.getFamily().getFamilyId()
                );

        if (alreadyMember) {
                throw new RuntimeException("Bạn đã là thành viên của family này");
        }

        FamilyRelationship relationship = new FamilyRelationship();
        relationship.setProfile(profile);
        relationship.setFamily(invitation.getFamily());
        relationship.setRole(invitation.getRole()); // sửa ở đây
        relationship.setJoinAt(LocalDate.now());

        familyRelationshipRepository.save(relationship);

        invitation.setStatus(InvitationStatus.ACCEPTED);
        familyInvitationRepository.save(invitation);
        }


    

    public void rejectInvitation(Integer currentUserId, Integer inviteId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user"));
    
        FamilyInvitation invitation = familyInvitationRepository
                .findByInviteIdAndReceiver_UserId(inviteId, currentUser.getUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lời mời"));
    
        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new RuntimeException("Lời mời không còn hiệu lực");
        }
    
        invitation.setStatus(InvitationStatus.REJECTED);
        familyInvitationRepository.save(invitation);
    }

    public void removeMember(Integer currentUserId, Integer profileId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user"));
    
        // 1. Lấy profile của người đang đăng nhập
        HealthProfile currentProfile = healthProfileRepository.findByUser_UserId(currentUser.getUserId())
                .orElseThrow(() -> new RuntimeException("Bạn chưa có health profile"));
    
        // 2. Lấy relationship của người đang đăng nhập
        FamilyRelationship currentRelationship = familyRelationshipRepository
                .findByProfile_Profile(currentProfile.getProfile())
                .orElseThrow(() -> new RuntimeException("Bạn chưa thuộc family nào"));
    
        // 3. Chỉ owner mới được xóa
        if (currentRelationship.getRole() != FamilyRole.OWNER) {
            throw new RuntimeException("Chỉ OWNER mới có quyền xóa thành viên");
        }
    
        Integer familyId = currentRelationship.getFamily().getFamilyId();
    
        // 4. Không cho owner tự xóa chính mình
        if (currentProfile.getProfile().equals(profileId)) {
            throw new RuntimeException("OWNER không thể tự xóa chính mình");
        }
    
        // 5. Tìm relationship của member cần xóa trong cùng family
        FamilyRelationship targetRelationship = familyRelationshipRepository
                .findByProfile_ProfileAndFamily_FamilyId(profileId, familyId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thành viên trong family"));
    
        // 6. Không cho xóa OWNER
        if (targetRelationship.getRole() == FamilyRole.OWNER) {
            throw new RuntimeException("Không thể xóa OWNER");
        }
    
        // 7. Gỡ liên kết 2 chiều trước khi xóa
        HealthProfile targetProfile = targetRelationship.getProfile();
        if (targetProfile != null) {
            targetProfile.setFamilyRelationship(null);
        }
        targetRelationship.setProfile(null);
    
        // 8. Xóa relationship
        familyRelationshipRepository.delete(targetRelationship);
        familyRelationshipRepository.flush();
    }
}
