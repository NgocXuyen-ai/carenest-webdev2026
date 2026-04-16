package com.carenest.backend.model.enums;

public enum AiProvider {
    OPENAI("OpenAI"),
    GEMINI("Gemini"),
    CLAUDE("Claude"),
    OTHER("Khác");

    private final String displayName;

    AiProvider(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
