package com.carenest.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

import com.carenest.backend.model.enums.ChatMessageType;
import com.carenest.backend.model.enums.ChatSender;

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
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private AiConversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id")
    private AiRequestLog requestLog;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ocr_id")
    private OcrSession ocrSession;

    @NotNull(message = "Sender không được để trống")
    @Enumerated(EnumType.STRING)
    @Column(name = "sender")
    private ChatSender sender;

    @NotNull(message = "MessageType không được để trống")
    @Enumerated(EnumType.STRING)
    @Column(name = "message_type")
    private ChatMessageType messageType;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;
}