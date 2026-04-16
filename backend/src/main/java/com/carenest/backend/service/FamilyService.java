package com.carenest.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.List;

import org.springframework.stereotype.Service;

import com.carenest.backend.dto.family.CreateFamilyRequest;
import com.carenest.backend.dto.family.CreateHealthProfileRequest;
import com.carenest.backend.dto.family.FamilyInvitationResponse;
import com.carenest.backend.dto.family.FamilyMemberItemResponse;
import com.carenest.backend.dto.family.InviteMemberRequest;
import com.carenest.backend.dto.family.MyFamilyResponse;
import com.carenest.backend.dto.family.ReceivedInvitationResponse;
import com.carenest.backend.dto.family.SentInvitationResponse;
import com.carenest.backend.model.Family;
import com.carenest.backend.model.FamilyInvitation;
import com.carenest.backend.model.FamilyRelationship;
import com.carenest.backend.model.HealthProfile;
import com.carenest.backend.model.User;
import com.carenest.backend.model.enums.FamilyRole;
import com.carenest.backend.model.enums.InvitationStatus;
import com.carenest.backend.repository.FamilyInvitationRepository;
import com.carenest.backend.repository.FamilyRelationshipRepository;
import com.carenest.backend.repository.FamilyRepository;
import com.carenest.backend.repository.HealthProfileRepository;
import com.carenest.backend.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class FamilyService {
    private final FamilyRepository familyRepository;
    private final HealthProfileRepository healthProfileRepository;
    private final FamilyRelationshipRepository familyRelationshipRepository;
    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final FamilyInvitationRepository familyInvitationRepository;

    public FamilyService(FamilyRepository familyRepository,
                         HealthProfileRepository healthProfileRepository,
                         FamilyRelationshipRepository familyRelationshipRepository,
                         CurrentUserService currentUserService,
                         UserRepository userRepository,
                         FamilyInvitationRepository familyInvitationRepository) {
        this.familyRepository = familyRepository;
        this.healthProfileRepository = healthProfileRepository;
        this.familyRelationshipRepository = familyRelationshipRepository;
        this.currentUserService = currentUserService;
        this.userRepository = userRepository;
        this.familyInvitationRepository = familyInvitationRepository;
    }

    public void createFamily(HttpServletRequest request, CreateFamilyRequest req) {
        User currentUser = currentUserService.getCurrentUser(request);

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
    }

    public void createProfile(HttpServletRequest request, CreateHealthProfileRequest req) {
        User user = currentUserService.getCurrentUser(request);

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

    public MyFamilyResponse getMyFamily(HttpServletRequest request) {
        User currentUser = currentUserService.getCurrentUser(request);

        HealthProfile myProfile = healthProfileRepository
                .findByUser_UserId(currentUser.getUserId())
                .orElseThrow(() -> new RuntimeException("Bạn chưa có hồ sơ sức khỏe"));

        FamilyRelationship myRelationship = familyRelationshipRepository
                .findByProfile_ProfileId(myProfile.getProfileId())
                .orElseThrow(() -> new RuntimeException("Bạn chưa thuộc family nào"));

        Family family = myRelationship.getFamily();

        List<FamilyRelationship> relationships =
                familyRelationshipRepository.findAllByFamily_FamilyId(family.getFamilyId());

        List<FamilyMemberItemResponse> members = relationships.stream()
                .map(rel -> {
                    HealthProfile profile = rel.getProfile();
    
                    return new FamilyMemberItemResponse(
                            profile.getProfileId(),
                            profile.getFullName(),
                            profile.getBirthday(),
                            calculateAge(profile.getBirthday()),
                            rel.getRole(),
                            profile.getBloodType(),
                            profile.getHeight(),
                            profile.getWeight(),
                            profile.getMedicalHistory(),
                            profile.getAllergy(),
                            mapHealthStatus(profile)
                    );
                })
                .toList();

        return new MyFamilyResponse(
                family.getFamilyId(),
                family.getName(),
                members.size(),
                members
        );
    }

    private Integer calculateAge(LocalDate birthday) {
        if (birthday == null) {
            return null;
        }
        return Period.between(birthday, LocalDate.now()).getYears();
    }

    private String mapHealthStatus(HealthProfile profile) {
        if (profile.getMedicalHistory() != null && !profile.getMedicalHistory().isBlank()) {
            return "CẦN THEO DÕI";
        }
        return "SỨC KHỎE TỐT";
    }

    //Mời thành viên
    public FamilyInvitationResponse inviteMember(HttpServletRequest request, InviteMemberRequest dto) {

        User currentUser = currentUserService.getCurrentUser(request);

        if (dto.getReceiverEmail() == null || dto.getReceiverEmail().trim().isEmpty()) {
            throw new RuntimeException("Email không được để trống");
        }

        String receiverEmail = dto.getReceiverEmail().trim().toLowerCase();

        // 1. Lấy profile của sender
        HealthProfile senderProfile = healthProfileRepository.findByUser_UserId(currentUser.getUserId())
                .orElseThrow(() -> new RuntimeException("Bạn chưa có health profile"));

        // 2. Lấy relationship
        FamilyRelationship senderRelationship = familyRelationshipRepository
                .findByProfile_ProfileId(senderProfile.getProfileId())
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
                .existsByProfile_ProfileIdAndFamily_FamilyId(
                        receiverProfile.getProfileId(),
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

    public List<FamilyInvitationResponse> getMyInvitations(HttpServletRequest request) {
        User currentUser = currentUserService.getCurrentUser(request);
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

    public List<ReceivedInvitationResponse> getReceivedInvitations(HttpServletRequest request) {
        User currentUser = currentUserService.getCurrentUser(request);

        List<FamilyInvitation> invitations = familyInvitationRepository
                .findAllByReceiverAndStatusOrderByCreatedAtDesc(
                        currentUser.getUserId(),
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

    public List<SentInvitationResponse> getSentInvitations(HttpServletRequest request) {
        User currentUser = currentUserService.getCurrentUser(request);

        HealthProfile senderProfile = healthProfileRepository.findByUser_UserId(currentUser.getUserId())
                .orElseThrow(() -> new RuntimeException("Bạn chưa có health profile"));

        FamilyRelationship relationship = familyRelationshipRepository
                .findByProfile_ProfileId(senderProfile.getProfileId())
                .orElseThrow(() -> new RuntimeException("Bạn chưa thuộc family nào"));

        if (relationship.getRole() != FamilyRole.OWNER) {
            throw new RuntimeException("Chỉ owner mới được xem lời mời đã gửi");
        }

        List<FamilyInvitation> invitations = familyInvitationRepository
                .findAllBySenderOrderByCreatedAtDesc(currentUser.getUserId());

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

    public void acceptInvitation(HttpServletRequest request, Integer inviteId) {
        User currentUser = currentUserService.getCurrentUser(request);
    
        FamilyInvitation invitation = familyInvitationRepository
                .findByInviteId_AndReceiver(inviteId, currentUser.getUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lời mời"));
    
        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new RuntimeException("Lời mời không còn hiệu lực");
        }
    
        HealthProfile profile = healthProfileRepository.findByUser_UserId(currentUser.getUserId())
                .orElseThrow(() -> new RuntimeException("Bạn chưa có health profile"));
    
        boolean alreadyMember = familyRelationshipRepository
                .existsByProfile_ProfileIdAndFamily_FamilyId(
                        profile.getProfileId(),
                        invitation.getFamily().getFamilyId()
                );
    
        if (alreadyMember) {
            throw new RuntimeException("Bạn đã là thành viên của family này");
        }
    
        FamilyRelationship relationship = new FamilyRelationship();
        relationship.setProfile(profile);
        relationship.setFamily(invitation.getFamily());
        relationship.setRole(FamilyRole.MEMBER);
        relationship.setJoinAt(LocalDate.now());
    
        familyRelationshipRepository.save(relationship);
    
        invitation.setStatus(InvitationStatus.ACCEPTED);
        familyInvitationRepository.save(invitation);
    }

    public void rejectInvitation(HttpServletRequest request, Integer inviteId) {
        User currentUser = currentUserService.getCurrentUser(request);
    
        FamilyInvitation invitation = familyInvitationRepository
                .findByInviteIdAndReceiver_UserId(inviteId, currentUser.getUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lời mời"));
    
        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new RuntimeException("Lời mời không còn hiệu lực");
        }
    
        invitation.setStatus(InvitationStatus.REJECTED);
        familyInvitationRepository.save(invitation);
    }

    public void removeMember(HttpServletRequest request, Integer profileId) {
        User currentUser = currentUserService.getCurrentUser(request);
    
        // 1. Lấy profile của người đang đăng nhập
        HealthProfile currentProfile = healthProfileRepository.findByUser_UserId(currentUser.getUserId())
                .orElseThrow(() -> new RuntimeException("Bạn chưa có health profile"));
    
        // 2. Lấy relationship của người đang đăng nhập
        FamilyRelationship currentRelationship = familyRelationshipRepository
                .findByProfile_ProfileId(currentProfile.getProfileId())
                .orElseThrow(() -> new RuntimeException("Bạn chưa thuộc family nào"));
    
        // 3. Chỉ owner mới được xóa
        if (currentRelationship.getRole() != FamilyRole.OWNER) {
            throw new RuntimeException("Chỉ OWNER mới có quyền xóa thành viên");
        }
    
        Integer familyId = currentRelationship.getFamily().getFamilyId();
    
        // 4. Không cho owner tự xóa chính mình
        if (currentProfile.getProfileId().equals(profileId)) {
            throw new RuntimeException("OWNER không thể tự xóa chính mình");
        }
    
        // 5. Tìm relationship của member cần xóa trong cùng family
        FamilyRelationship targetRelationship = familyRelationshipRepository
                .findByProfile_ProfileIdAndFamily_FamilyId(profileId, familyId)
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
