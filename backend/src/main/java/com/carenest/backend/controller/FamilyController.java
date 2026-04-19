package com.carenest.backend.controller;

import org.springframework.web.bind.annotation.RestController;

import com.carenest.backend.dto.family.CreateFamilyMemberProfileRequest;
import com.carenest.backend.dto.family.CreateFamilyRequest;
import com.carenest.backend.dto.family.FamilyInvitationResponse;
import com.carenest.backend.dto.family.InviteMemberRequest;
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

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@RestController
@RequestMapping("/api/v1/family")
public class FamilyController {
    public final FamilyService familyService;
    
    public FamilyController(FamilyService familyService){
        this.familyService = familyService;
    }

    @PostMapping("/create-family")
    public ResponseEntity<ApiResponse<CreateFamilyRequest>> createFamily(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestBody CreateFamilyRequest req) {
        this.familyService.createFamily(((CustomUserDetails)userDetails).getId(), req);
        return ApiResponse.success(req, "Tạo Family thành công");
    }

    @PostMapping("/create-healthprofile")
    public ResponseEntity<ApiResponse<CreateHealthProfileRequest>> createProfile(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestBody CreateHealthProfileRequest req) {
        this.familyService.createProfile(((CustomUserDetails)userDetails).getId(), req);
        return ApiResponse.success(req, "Tạo profile thành công");
    }

    @PutMapping("/update-healthprofile/{profileId}")
    public ResponseEntity<ApiResponse<UpdateHealthProfileRequest>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Integer profileId,
            @RequestBody UpdateHealthProfileRequest req) {

        this.familyService.updateProfile(((CustomUserDetails) userDetails).getId(), profileId, req);
        return ApiResponse.success(req, "Cập nhật profile thành công");
    }

    @PostMapping("/{familyId}/profiles")
    public ResponseEntity<ApiResponse<Void>> createDependentProfile(
            @PathVariable Integer familyId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CreateFamilyMemberProfileRequest req
    ) {
        Integer currentUserId = ((CustomUserDetails) userDetails).getId();
        familyService.createDependentProfile(currentUserId, familyId, req);
        return ApiResponse.success(null, "Tạo profile thành viên family thành công");
    }
    
    @GetMapping("/family")
    public ResponseEntity<ApiResponse<MyFamilyResponse>> getMyFamily(@AuthenticationPrincipal UserDetails userDetails) {
        MyFamilyResponse data = familyService.getMyFamily(((CustomUserDetails)userDetails).getId());
        return ApiResponse.success(data, "Lấy thông tin family thành công");
    }

    @GetMapping("/profiles/{profileId}")
    public ResponseEntity<ApiResponse<ProfileDetailsResponse>> getFamilyMemberProfile(
            @PathVariable Integer profileId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new RuntimeException("Bạn chưa đăng nhập");
        }

        ProfileDetailsResponse response =
                familyService.getFamilyMemberProfile(userDetails.getId(), profileId);

        return ApiResponse.success(response, "Lấy chi tiết profile thành công");
    }
    
    @PostMapping("/family/invitations")
    public ResponseEntity<ApiResponse<FamilyInvitationResponse>> inviteMember(
            @Valid @RequestBody InviteMemberRequest requestDto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        FamilyInvitationResponse response = this.familyService.inviteMember(((CustomUserDetails)userDetails).getId(), requestDto);
        return ApiResponse.success(response, "Gửi lời mời thành công");
    }

    @GetMapping("/invitations/received")
    public ResponseEntity<ApiResponse<List<ReceivedInvitationResponse>>> getReceivedInvitations(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<ReceivedInvitationResponse> response = familyService.getReceivedInvitations(((CustomUserDetails)userDetails).getId());
        return ApiResponse.success(response, "Lấy danh sách lời mời đã nhận thành công");
    }

    @GetMapping("/invitations/sent")
    public ResponseEntity<ApiResponse<List<SentInvitationResponse>>> getSentInvitations(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<SentInvitationResponse> response = familyService.getSentInvitations(((CustomUserDetails)userDetails).getId());
        return ApiResponse.success(response, "Lấy danh sách lời mời đã gửi thành công");
    }

    @PostMapping("/{inviteId}/accept")
    public ResponseEntity<ApiResponse<String>> acceptInvitation(
            @PathVariable Integer inviteId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        familyService.acceptInvitation(((CustomUserDetails)userDetails).getId(), inviteId);
        return ApiResponse.success("OK", "Chấp nhận lời mời thành công");
    }

    @PostMapping("/{inviteId}/reject")
    public ResponseEntity<ApiResponse<String>> rejectInvitation(
            @PathVariable Integer inviteId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        familyService.rejectInvitation(((CustomUserDetails)userDetails).getId(), inviteId);
        return ApiResponse.success("OK", "Từ chối lời mời thành công");
    }

    @DeleteMapping("/members/{profileId}")
    public ResponseEntity<ApiResponse<String>> removeMember(
            @PathVariable Integer profileId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        familyService.removeMember(((CustomUserDetails)userDetails).getId(), profileId);
        return ApiResponse.success("OK", "Xóa thành viên khỏi family thành công");
    }
}
