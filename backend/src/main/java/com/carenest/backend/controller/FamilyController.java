package com.carenest.backend.controller;

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
import com.carenest.backend.dto.profile.ProfileDetailsResponse;
import com.carenest.backend.dto.profile.UpdateHealthProfileRequest;
import com.carenest.backend.helper.ApiResponse;
import com.carenest.backend.security.CustomUserDetails;
import com.carenest.backend.service.FamilyService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/family")
public class FamilyController {
    public final FamilyService familyService;

    public FamilyController(FamilyService familyService) {
        this.familyService = familyService;
    }

    @PostMapping("/create-family")
    public ResponseEntity<ApiResponse<CreateFamilyRequest>> createFamily(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CreateFamilyRequest req
    ) {
        familyService.createFamily(((CustomUserDetails) userDetails).getId(), req);
        return ApiResponse.success(req, "Tao Family thanh cong");
    }

    @PostMapping("/create-healthprofile")
    public ResponseEntity<ApiResponse<CreateHealthProfileRequest>> createProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CreateHealthProfileRequest req
    ) {
        familyService.createProfile(((CustomUserDetails) userDetails).getId(), req);
        return ApiResponse.success(req, "Tao profile thanh cong");
    }

    @PutMapping("/update-healthprofile/{profileId}")
    public ResponseEntity<ApiResponse<UpdateHealthProfileRequest>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Integer profileId,
            @RequestBody UpdateHealthProfileRequest req
    ) {
        familyService.updateProfile(((CustomUserDetails) userDetails).getId(), profileId, req);
        return ApiResponse.success(req, "Cap nhat profile thanh cong");
    }

    @PostMapping("/{familyId}/profiles")
    public ResponseEntity<ApiResponse<Void>> createDependentProfile(
            @PathVariable Integer familyId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CreateFamilyMemberProfileRequest req
    ) {
        familyService.createDependentProfile(((CustomUserDetails) userDetails).getId(), familyId, req);
        return ApiResponse.success(null, "Tao profile thanh vien family thanh cong");
    }

    @GetMapping("/family")
    public ResponseEntity<ApiResponse<MyFamilyResponse>> getMyFamily(@AuthenticationPrincipal UserDetails userDetails) {
        MyFamilyResponse data = familyService.getMyFamily(((CustomUserDetails) userDetails).getId());
        return ApiResponse.success(data, "Lay thong tin family thanh cong");
    }

    @GetMapping("/profiles/{profileId}")
    public ResponseEntity<ApiResponse<ProfileDetailsResponse>> getFamilyMemberProfile(
            @PathVariable Integer profileId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new RuntimeException("Ban chua dang nhap");
        }

        ProfileDetailsResponse response = familyService.getFamilyMemberProfile(userDetails.getId(), profileId);
        return ApiResponse.success(response, "Lay chi tiet profile thanh cong");
    }

    @PostMapping("/family/invitations")
    public ResponseEntity<ApiResponse<FamilyInvitationResponse>> inviteMember(
            @Valid @RequestBody InviteMemberRequest requestDto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        FamilyInvitationResponse response = familyService.inviteMember(((CustomUserDetails) userDetails).getId(), requestDto);
        return ApiResponse.success(response, "Gui loi moi thanh cong");
    }

    @GetMapping("/invitations/received")
    public ResponseEntity<ApiResponse<List<ReceivedInvitationResponse>>> getReceivedInvitations(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<ReceivedInvitationResponse> response = familyService.getReceivedInvitations(((CustomUserDetails) userDetails).getId());
        return ApiResponse.success(response, "Lay danh sach loi moi da nhan thanh cong");
    }

    @GetMapping("/invitations/sent")
    public ResponseEntity<ApiResponse<List<SentInvitationResponse>>> getSentInvitations(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<SentInvitationResponse> response = familyService.getSentInvitations(((CustomUserDetails) userDetails).getId());
        return ApiResponse.success(response, "Lay danh sach loi moi da gui thanh cong");
    }

    @PostMapping("/{inviteId}/accept")
    public ResponseEntity<ApiResponse<String>> acceptInvitation(
            @PathVariable Integer inviteId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        familyService.acceptInvitation(((CustomUserDetails) userDetails).getId(), inviteId);
        return ApiResponse.success("OK", "Chap nhan loi moi thanh cong");
    }

    @PostMapping("/{inviteId}/reject")
    public ResponseEntity<ApiResponse<String>> rejectInvitation(
            @PathVariable Integer inviteId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        familyService.rejectInvitation(((CustomUserDetails) userDetails).getId(), inviteId);
        return ApiResponse.success("OK", "Tu choi loi moi thanh cong");
    }

    @DeleteMapping("/members/{profileId}")
    public ResponseEntity<ApiResponse<String>> removeMember(
            @PathVariable Integer profileId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        familyService.removeMember(((CustomUserDetails) userDetails).getId(), profileId);
        return ApiResponse.success("OK", "Xoa thanh vien khoi family thanh cong");
    }

    @GetMapping("/join-code")
    public ResponseEntity<ApiResponse<FamilyJoinCodeResponse>> getJoinCode(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        FamilyJoinCodeResponse response = familyService.getJoinCode(((CustomUserDetails) userDetails).getId());
        return ApiResponse.success(response, "Lay ma tham gia thanh cong");
    }

    @PostMapping("/join-code/rotate")
    public ResponseEntity<ApiResponse<FamilyJoinCodeResponse>> rotateJoinCode(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        FamilyJoinCodeResponse response = familyService.rotateJoinCode(((CustomUserDetails) userDetails).getId());
        return ApiResponse.success(response, "Tao ma tham gia moi thanh cong");
    }

    @PostMapping("/join-by-code")
    public ResponseEntity<ApiResponse<MyFamilyResponse>> joinByCode(
            @Valid @RequestBody JoinFamilyByCodeRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        MyFamilyResponse response = familyService.joinByCode(((CustomUserDetails) userDetails).getId(), request);
        return ApiResponse.success(response, "Tham gia family thanh cong");
    }

    @PostMapping(value = "/join-by-qr", consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<MyFamilyResponse>> joinByQr(
            @RequestPart("image") MultipartFile image,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        MyFamilyResponse response = familyService.joinByQr(((CustomUserDetails) userDetails).getId(), image);
        return ApiResponse.success(response, "Quet QR va tham gia family thanh cong");
    }
}
