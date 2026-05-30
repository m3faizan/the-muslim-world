"""One-shot converter: parse lib/db/seed.sql -> /app/backend/seed_data.json"""
from __future__ import annotations

import json
import re
from pathlib import Path

SEED_PATH = Path(__file__).resolve().parent.parent / "lib" / "db" / "seed.sql"
OUT_PATH = Path(__file__).resolve().parent / "seed_data.json"

SITE_COLUMNS = [
    "id",
    "name",
    "arabicName",
    "region",
    "country",
    "latitude",
    "longitude",
    "category",
    "shortDescription",
    "fullDescription",
    "yearFounded",
    "significance",
    "isFeatured",
    "imageUrl",
    "architecturalStyle",
    "createdAt",
    "modelUrl",
    "capacity",
    "areaSqm",
    "dualUse",
    "eidPrayer",
    "ramadanVisit",
    "jumaPrayer",
    "sect",
]

HOTSPOT_COLUMNS = [
    "id",
    "siteId",
    "label",
    "description",
    "positionX",
    "positionY",
    "positionZ",
    "arabicTerm",
    "historicalPeriod",
    "imageUrl",
]


def split_values(values_str: str) -> list[str]:
    """Split a Postgres VALUES tuple body honoring single-quoted strings with '' escapes."""
    result: list[str] = []
    buf: list[str] = []
    i = 0
    in_str = False
    paren_depth = 0
    while i < len(values_str):
        ch = values_str[i]
        if in_str:
            if ch == "'":
                # Handle SQL '' escape
                if i + 1 < len(values_str) and values_str[i + 1] == "'":
                    buf.append("'")
                    i += 2
                    continue
                in_str = False
                buf.append(ch)
            else:
                buf.append(ch)
        else:
            if ch == "'":
                in_str = True
                buf.append(ch)
            elif ch == "(":
                paren_depth += 1
                buf.append(ch)
            elif ch == ")":
                paren_depth -= 1
                buf.append(ch)
            elif ch == "," and paren_depth == 0:
                result.append("".join(buf).strip())
                buf = []
            else:
                buf.append(ch)
        i += 1
    if buf:
        result.append("".join(buf).strip())
    return result


def parse_value(raw: str):
    raw = raw.strip()
    if raw == "NULL":
        return None
    if raw.upper() == "NOW()":
        return None  # treat NOW() as createdAt placeholder, we will fill later
    if raw == "true":
        return True
    if raw == "false":
        return False
    if raw.startswith("'") and raw.endswith("'"):
        inner = raw[1:-1]
        return inner.replace("''", "'")
    # numeric
    if re.fullmatch(r"-?\d+", raw):
        return int(raw)
    try:
        return float(raw)
    except ValueError:
        return raw


def parse_insert_block(sql: str, table_pattern: str, columns: list[str]) -> list[dict]:
    rows: list[dict] = []
    pattern = re.compile(
        rf"INSERT\s+INTO\s+{table_pattern}\s+VALUES\s*\((.*?)\)\s*ON\s+CONFLICT",
        re.IGNORECASE | re.DOTALL,
    )
    for match in pattern.finditer(sql):
        values_str = match.group(1)
        raw_values = split_values(values_str)
        if len(raw_values) != len(columns):
            print(
                f"WARN: column count mismatch: got {len(raw_values)}, expected {len(columns)} -> {raw_values[:3]}"
            )
            continue
        row = {col: parse_value(val) for col, val in zip(columns, raw_values)}
        rows.append(row)
    return rows


def main() -> None:
    sql = SEED_PATH.read_text(encoding="utf-8")
    sites = parse_insert_block(sql, r"public\.sites", SITE_COLUMNS)
    hotspots = parse_insert_block(sql, r"public\.hotspots", HOTSPOT_COLUMNS)
    print(f"Parsed {len(sites)} sites, {len(hotspots)} hotspots")
    OUT_PATH.write_text(
        json.dumps({"sites": sites, "hotspots": hotspots}, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
