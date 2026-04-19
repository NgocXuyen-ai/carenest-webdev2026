"""
Context builder: formats conversation history into a compact prompt block for the LLM.

Strategy: Structured Pair Sliding Window
- Groups messages into (user question, SQL generated, assistant reply) triplets
- Keeps only the last N pairs within a token budget
- Injects as a single text block in the HumanMessage (keeps LangChain message array simple)

For Text-to-SQL this is more useful than raw chat history because:
- The LLM sees what SQL was generated for similar questions (guides follow-up SQL)
- The LLM can resolve pronouns/references from prior turns
- Token cost is ~150 tokens/pair vs ~400+ for full message pairs
"""
import json
from typing import Optional

# Max estimated tokens to use for history block
_MAX_HISTORY_TOKENS = 750


def build_contextual_message(history: list[dict], current_message: str) -> str:
    """
    Build the HumanMessage content combining conversation history and the current question.

    If history is empty, returns just current_message (fully backward compatible).

    Args:
        history: Messages from get_recent_history(), ordered oldest-first.
                 Each dict: {message_id, sender, message_type, content, sent_at}
        current_message: The user's current question.

    Returns:
        A formatted string ready to be used as HumanMessage content.
    """
    if not history:
        return current_message

    pairs = _group_into_pairs(history)
    if not pairs:
        return current_message

    pairs = _trim_history_to_budget(pairs, _MAX_HISTORY_TOKENS)
    if not pairs:
        return current_message

    lines = ["## Lịch sử hội thoại gần đây\n"]
    for i, pair in enumerate(pairs, 1):
        lines.append(f"**[{i}] Người dùng:** {pair['user_message']}")
        if pair.get("sql_query"):
            # Truncate long SQL to keep tokens low
            sql_preview = pair["sql_query"][:300].replace("\n", " ")
            lines.append(f"SQL: {sql_preview}")
        if pair.get("result_summary"):
            lines.append(f"Kết quả: {pair['result_summary']}")
        lines.append("")  # blank line between pairs

    lines.append("## Câu hỏi hiện tại")
    lines.append(current_message)

    return "\n".join(lines)


def build_answer_context(
    previous_reply: Optional[str],
    current_message: str,
    sql_results: list[dict],
) -> str:
    """
    Build the prompt for the answer-generation step (Step 3 in the pipeline).
    Includes a short summary of the previous reply for follow-up resolution.
    """
    parts = []

    if previous_reply:
        # Include a truncated version so the LLM knows what "chi tiết hơn" refers to
        preview = previous_reply[:200]
        parts.append(f"Câu trả lời trước đó: {preview}\n")

    parts.append(f"Câu hỏi của người dùng: {current_message}\n")
    parts.append(
        f"Kết quả từ database:\n"
        f"{json.dumps(sql_results, ensure_ascii=False, indent=2)}\n"
    )
    parts.append(
        "Hãy trả lời câu hỏi bằng tiếng Việt tự nhiên, thân thiện dựa trên dữ liệu này. "
        "Nếu dữ liệu rỗng, hãy thông báo lịch sự là không tìm thấy thông tin. "
        "Không đề cập đến SQL hay database trong câu trả lời."
    )
    return "\n".join(parts)


def build_structured_context_prompt(
    context: dict,
    history: list[dict],
    current_message: str,
) -> str:
    history_lines = []
    for msg in history[-6:]:
        sender = msg.get("sender", "")
        message_type = msg.get("message_type", "")
        if message_type != "TEXT":
            continue
        history_lines.append(f"{sender}: {msg.get('content', '')}")

    prompt_parts = [
        "Bạn là trợ lý sức khỏe gia đình CareNest.",
        "Chỉ sử dụng dữ liệu trong CONTEXT dưới đây để trả lời.",
        "Nếu dữ liệu chưa có hoặc không đủ, hãy nói rõ là chưa có thông tin thay vì suy đoán.",
        "Không nhắc đến SQL, database hay kỹ thuật nội bộ.",
        "",
        "## CONTEXT",
        json.dumps(context, ensure_ascii=False, indent=2),
    ]

    if history_lines:
        prompt_parts.extend([
            "",
            "## LỊCH SỬ HỘI THOẠI GẦN ĐÂY",
            "\n".join(history_lines),
        ])

    prompt_parts.extend([
        "",
        "## CÂU HỎI HIỆN TẠI",
        current_message,
    ])
    return "\n".join(prompt_parts)


# ─── Internal helpers ─────────────────────────────────────────────────────────

def _group_into_pairs(history: list[dict]) -> list[dict]:
    """
    Group sequential messages into turn pairs.
    A pair is: one user message + (optional) sql_query + (optional) assistant text reply.

    Returns list of dicts:
        {user_message, sql_query, assistant_reply, result_summary}
    """
    pairs = []
    current_pair: Optional[dict] = None

    for msg in history:
        sender = msg["sender"]
        mtype = msg["message_type"]
        content = msg["content"]

        if sender == "USER":
            # Start a new pair
            if current_pair:
                pairs.append(current_pair)
            current_pair = {
                "user_message": content,
                "sql_query": None,
                "assistant_reply": None,
                "result_summary": None,
            }

        elif sender == "AI" and current_pair is not None:
            if mtype == "SQL_QUERY":
                current_pair["sql_query"] = content
            elif mtype == "TEXT":
                current_pair["assistant_reply"] = content
                # Build a short summary: first 80 chars of reply
                current_pair["result_summary"] = content[:80].strip()

    # Don't forget the last open pair
    if current_pair:
        pairs.append(current_pair)

    # Only return pairs that have at least a user message
    return [p for p in pairs if p["user_message"]]


def _estimate_tokens(text: str) -> int:
    """Approximate token count. Vietnamese ~4 chars/token."""
    return max(1, len(text) // 4)


def _trim_history_to_budget(pairs: list[dict], budget: int) -> list[dict]:
    """
    Drop the oldest pairs until the total estimated token count is within budget.
    Always keeps at least 1 pair (the most recent) regardless of size.
    """
    if not pairs:
        return pairs

    def pair_tokens(p: dict) -> int:
        total = _estimate_tokens(p["user_message"])
        if p.get("sql_query"):
            total += _estimate_tokens(p["sql_query"][:300])
        if p.get("result_summary"):
            total += _estimate_tokens(p["result_summary"])
        return total

    while len(pairs) > 1:
        total = sum(pair_tokens(p) for p in pairs)
        if total <= budget:
            break
        pairs = pairs[1:]  # drop oldest

    return pairs
