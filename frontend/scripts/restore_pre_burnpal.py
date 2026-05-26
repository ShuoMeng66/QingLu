import json
from pathlib import Path

TRANSCRIPT = Path(
    r"C:\Users\MR\.cursor\projects\d-Hackathod\agent-transcripts"
    r"\9a64819a-0c6f-4ff7-a568-5fc27e6185ea"
    r"\9a64819a-0c6f-4ff7-a568-5fc27e6185ea.jsonl"
)
FRONTEND = Path(r"D:\Hackathod\frontend")
STOP_LINE = 916

files: dict[str, str] = {}
failed: list[str] = []


def norm_path(p: str) -> str | None:
    p = p.replace("\\", "/")
    lower = p.lower()
    if "/frontend/" in lower:
        idx = lower.index("/frontend/")
        return p[idx + len("/frontend/") :]
    if lower.startswith("d:/hackathod/frontend/"):
        return p.split("frontend/", 1)[1]
    return None


with TRANSCRIPT.open("r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if i >= STOP_LINE:
            break
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        if obj.get("role") != "assistant":
            continue
        for item in obj.get("message", {}).get("content", []):
            if item.get("type") != "tool_use":
                continue
            name = item.get("name")
            inp = item.get("input", {})
            rel = norm_path(inp.get("path", ""))
            if not rel:
                continue
            if name == "Write":
                files[rel] = inp.get("contents", "")
            elif name == "StrReplace":
                old = inp.get("old_string", "")
                new = inp.get("new_string", "")
                if rel in files:
                    content = files[rel]
                else:
                    full = FRONTEND / rel
                    content = full.read_text(encoding="utf-8") if full.exists() else ""
                if not content or old not in content:
                    failed.append(f"L{i} {rel}")
                    continue
                files[rel] = content.replace(old, new, 1)

for rel, content in files.items():
    target = FRONTEND / rel
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")

print(f"Restored {len(files)} files, {len(failed)} failed patches")
for r in sorted(files):
    if any(
        x in r
        for x in [
            "Cover",
            "cover",
            "ChatShell",
            "AppShell",
            "routes",
            "copy/ui",
            "index.html",
            "index.css",
            "organic",
            "chat-shell",
            "AppNav",
            "Workspace",
            "MessageBubble",
            "CoverMotion",
            "AppMenu",
            "ChatPage",
        ]
    ):
        print(" ", r)
if failed[:10]:
    print("Failed samples:", failed[:10])
