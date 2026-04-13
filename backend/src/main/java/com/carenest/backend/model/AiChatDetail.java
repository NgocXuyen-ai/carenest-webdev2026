package com.carenest.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_chat_detail")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AiChatDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer messageId;

    @NotNull(message = "Conversation không được để trống")
    @ManyToOne
    @JoinColumn(name = "conversation_id", nullable = false)
    private AiConversation conversation;

    @Column(name = "request_id")
    private Integer requestId;

    @Column(name = "ocr_id")
    private Integer ocrId;

    @NotBlank(message = "Sender không được để trống")
    @Size(max = 255, message = "Sender tối đa 255 ký tự")
    @Column(name = "sender", length = 255)
    private String sender;

    @NotBlank(message = "MessageType không được để trống")
    @Size(max = 255, message = "MessageType tối đa 255 ký tự")
    @Column(name = "message_type", length = 255)
    private String messageType;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;
}
