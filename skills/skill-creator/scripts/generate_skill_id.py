#!/usr/bin/env python3
"""Generate a unique skill ID."""

import sys
import uuid


def main() -> int:
    skill_name = sys.argv[1] if len(sys.argv) > 1 else ""
    unique_part = str(uuid.uuid4()).split("-")[0]
    if skill_name:
        safe_name = "".join(c if c.isalnum() else "-" for c in skill_name.lower()).strip("-")
        skill_id = f"{safe_name}-{unique_part}"
    else:
        skill_id = unique_part
    print(skill_id)
    return 0


if __name__ == "__main__":
    sys.exit(main())