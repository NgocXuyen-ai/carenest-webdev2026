package com.carenest.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.carenest.backend.model.FamilyInvitation;
import com.carenest.backend.model.enums.InvitationStatus;

public interface FamilyInvitationRepository extends JpaRepository<FamilyInvitation, Integer> {

    boolean existsByReceiver_UserIdAndFamily_FamilyIdAndStatus(
        Integer receiver,
        Integer familyId,
        InvitationStatus status
    );

    List<FamilyInvitation> findAllByReceiver_UserIdAndStatus(
        Integer receiver,
        InvitationStatus status
	);
	Optional<FamilyInvitation> findByInviteId_AndReceiver(
		Integer inviteId,
		Integer receiver
	);	
	boolean existsByReceiverAndFamily_FamilyIdAndStatus(
		Integer receiver,
		Integer familyId,
		InvitationStatus status
	);	

	List<FamilyInvitation> findAllByReceiverAndStatusOrderByCreatedAtDesc(
        Integer receiver,
        InvitationStatus status
	);

	List<FamilyInvitation> findAllBySenderOrderByCreatedAtDesc(Integer sender);
	Optional<FamilyInvitation> findByInviteIdAndReceiver_UserId(
        Integer inviteId,
        Integer receiverId
	);
}
