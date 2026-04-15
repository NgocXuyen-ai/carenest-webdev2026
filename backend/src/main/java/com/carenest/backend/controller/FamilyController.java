package com.carenest.backend.controller;

import org.springframework.web.bind.annotation.RestController;

import com.carenest.backend.dto.family.CreateFamilyRequest;
import com.carenest.backend.dto.family.CreateHealthProfileRequest;
import com.carenest.backend.dto.family.FamilyInvitationResponse;
import com.carenest.backend.dto.family.InviteMemberRequest;
import com.carenest.backend.dto.family.MyFamilyResponse;
import com.carenest.backend.dto.family.ReceivedInvitationResponse;
import com.carenest.backend.dto.family.SentInvitationResponse;
import com.carenest.backend.helper.ApiResponse;
import com.carenest.backend.service.FamilyService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
public class FamilyController {
    public final FamilyService familyService;
    
    public FamilyController(FamilyService familyService){
        this.familyService = familyService;
    }

    @PostMapping("/create-family")
    public ResponseEntity<ApiResponse<CreateFamilyRequest>> createFamily(HttpServletRequest request,
                                        @RequestBody CreateFamilyRequest req) {
        this.familyService.createFamily(request, req);
        return ApiResponse.success(req, "Tạo Family thành công");
    }

    @PostMapping("/create-healthprofile")
    public ResponseEntity<ApiResponse<CreateHealthProfileRequest>> createProfile(HttpServletRequest request,
                                           @RequestBody CreateHealthProfileRequest req) {
        this.familyService.createProfile(request, req);
        return ApiResponse.success(req, "Tạo profile thành công");
    }
    
    @GetMapping("/family")
    public ResponseEntity<ApiResponse<MyFamilyResponse>> getMyFamily(HttpServletRequest request) {
        MyFamilyResponse data = familyService.getMyFamily(request);
        return ApiResponse.success(data, "Lấy thông tin family thành công");
    }
    
    @PostMapping("/family/invitations")
    public ResponseEntity<ApiResponse<FamilyInvitationResponse>> inviteMember(
            @Valid @RequestBody InviteMemberRequest requestDto,
            HttpServletRequest request
    ) {
        FamilyInvitationResponse response = this.familyService.inviteMember(request, requestDto);
        return ApiResponse.success(response, "Gửi lời mời thành công");
    }

    @GetMapping("/invitations/received")
    public ResponseEntity<ApiResponse<List<ReceivedInvitationResponse>>> getReceivedInvitations(
            HttpServletRequest request
    ) {
        List<ReceivedInvitationResponse> response = familyService.getReceivedInvitations(request);
        return ApiResponse.success(response, "Lấy danh sách lời mời đã nhận thành công");
    }

    @GetMapping("/invitations/sent")
    public ResponseEntity<ApiResponse<List<SentInvitationResponse>>> getSentInvitations(
            HttpServletRequest request
    ) {
        List<SentInvitationResponse> response = familyService.getSentInvitations(request);
        return ApiResponse.success(response, "Lấy danh sách lời mời đã gửi thành công");
    }

    @PostMapping("/{inviteId}/accept")
    public ResponseEntity<ApiResponse<String>> acceptInvitation(
            @PathVariable Integer inviteId,
            HttpServletRequest request
    ) {
        familyService.acceptInvitation(request, inviteId);
        return ApiResponse.success("OK", "Chấp nhận lời mời thành công");
    }

    @PostMapping("/{inviteId}/reject")
    public ResponseEntity<ApiResponse<String>> rejectInvitation(
            @PathVariable Integer inviteId,
            HttpServletRequest request
    ) {
        familyService.rejectInvitation(request, inviteId);
        return ApiResponse.success("OK", "Từ chối lời mời thành công");
    }

    @DeleteMapping("/members/{profileId}")
    public ResponseEntity<ApiResponse<String>> removeMember(
            @PathVariable Integer profileId,
            HttpServletRequest request
    ) {
        familyService.removeMember(request, profileId);
        return ApiResponse.success("OK", "Xóa thành viên khỏi family thành công");
    }
}
