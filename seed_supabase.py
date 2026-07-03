# -*- coding: utf-8 -*-
"""
Seed dữ liệu gia phả (members.json) lên Supabase.

Cách chạy:
    1) pip install supabase python-dotenv
    2) Tạo file .env (xem .env.example) với SUPABASE_URL và SUPABASE_SERVICE_KEY
    3) py seed_supabase.py

Logic 2 bước:
    Bước 1: Xoá sạch bảng -> insert tất cả member (parent_id = NULL),
            lưu mapping id_temp -> uuid thật do Supabase sinh.
    Bước 2: Dùng mapping cập nhật parent_id cho từng member có parent_id_temp.

Lưu ý: dùng SERVICE_KEY (service_role) để bypass RLS.
"""

import json
import os
import sys

from dotenv import load_dotenv
from supabase import create_client, Client

# In tiếng Việt / chữ Hán ra console không lỗi encoding (Windows)
sys.stdout.reconfigure(encoding="utf-8")

MEMBERS_JSON = "members.json"
BATCH_SIZE = 50

# Các cột thực sự tồn tại trong bảng `members` (loại bỏ id_temp / parent_id_temp)
DB_COLUMNS = [
    "name", "han_name", "generation",
    "death_anniversary", "grave", "details", "photo_url",
]

# UUID "rỗng" dùng cho mẹo truncate qua REST (.neq để khớp mọi dòng)
SENTINEL_UUID = "00000000-0000-0000-0000-000000000000"


# --- Khởi tạo client ---------------------------------------------------------

def get_client() -> Client:
    load_dotenv()  # đọc file .env ở thư mục hiện tại
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        print(
            "LỖI: Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_KEY trong .env\n"
            "      Xem file .env.example để biết định dạng.",
            file=sys.stderr,
        )
        sys.exit(1)
    # Chuẩn hoá URL: supabase-py cần URL gốc (https://xxx.supabase.co),
    # nó tự thêm '/rest/v1/'. Bỏ đuôi '/rest/v1' và dấu '/' thừa nếu có.
    url = url.strip().rstrip("/")
    if url.endswith("/rest/v1"):
        url = url[: -len("/rest/v1")]
    return create_client(url, key)


def chunked(seq, size):
    """Chia list thành các batch kích thước `size`."""
    for i in range(0, len(seq), size):
        yield seq[i:i + size]


# --- Bước 1: Xoá cũ + insert ------------------------------------------------

def step1_insert(supabase: Client, members: list) -> tuple[dict, list]:
    """
    Xoá toàn bộ bảng, insert lại tất cả member với parent_id = NULL.
    Trả về (mapping id_temp -> uuid, danh sách member insert lỗi).
    """
    total = len(members)
    print(f"\n=== BƯỚC 1: Xoá data cũ & insert {total} member ===")

    # 1.1 — Truncate bảng (xoá mọi dòng)
    try:
        supabase.table("members").delete().neq("id", SENTINEL_UUID).execute()
        print("Đã xoá toàn bộ data cũ trong bảng members.")
    except Exception as e:
        print(f"CẢNH BÁO: Lỗi khi xoá data cũ: {e}", file=sys.stderr)

    id_map = {}          # id_temp -> uuid thật
    failed = []          # member insert lỗi
    inserted = 0

    # 1.2 — Insert theo batch 50
    for batch in chunked(members, BATCH_SIZE):
        # Chỉ gửi các cột hợp lệ, parent_id để NULL (default) ở bước này
        rows = [{col: m.get(col) for col in DB_COLUMNS} for m in batch]
        try:
            resp = supabase.table("members").insert(rows).execute()
            data = resp.data or []

            # Supabase trả về các dòng đã insert THEO ĐÚNG THỨ TỰ gửi lên
            # => zip với batch để lấy mapping id_temp -> uuid.
            if len(data) != len(batch):
                print(
                    f"CẢNH BÁO: insert trả về {len(data)} dòng, gửi {len(batch)} "
                    f"-> mapping batch này có thể sai.",
                    file=sys.stderr,
                )
            for src, returned in zip(batch, data):
                id_map[src["id_temp"]] = returned["id"]

            inserted += len(data)
            print(f"Inserted {inserted}/{total}...")
        except Exception as e:
            # Batch lỗi -> thử insert TỪNG record để cô lập record hỏng
            print(f"LỖI batch insert: {e} -> thử insert từng record...", file=sys.stderr)
            for src in batch:
                row = {col: src.get(col) for col in DB_COLUMNS}
                try:
                    resp = supabase.table("members").insert(row).execute()
                    id_map[src["id_temp"]] = resp.data[0]["id"]
                    inserted += 1
                except Exception as e2:
                    print(f"  -> Bỏ qua '{src.get('name')}' (id_temp={src.get('id_temp')}): {e2}",
                          file=sys.stderr)
                    failed.append(src)
            print(f"Inserted {inserted}/{total}...")

    return id_map, failed


# --- Bước 2: Update parent_id ------------------------------------------------

def step2_update_parents(supabase: Client, members: list, id_map: dict) -> tuple[int, list]:
    """
    Cập nhật parent_id cho từng member có parent_id_temp.
    Trả về (số link thành công, danh sách cảnh báo không tìm thấy cha).
    """
    # Lọc các member cần update parent
    to_update = [m for m in members if m.get("parent_id_temp")]
    print(f"\n=== BƯỚC 2: Update parent_id cho {len(to_update)} member ===")

    linked = 0
    missing = []     # parent_id_temp không có trong mapping
    done = 0

    for batch in chunked(to_update, BATCH_SIZE):
        for m in batch:
            child_uuid = id_map.get(m["id_temp"])
            parent_uuid = id_map.get(m["parent_id_temp"])

            if child_uuid is None:
                # Member con không insert được ở bước 1 -> bỏ qua
                missing.append((m["name"], f"con chưa có uuid (id_temp={m['id_temp']})"))
                continue
            if parent_uuid is None:
                # Không tra được cha -> giữ parent_id = null
                missing.append((m["name"], f"không thấy cha (parent_id_temp={m['parent_id_temp']})"))
                continue

            try:
                supabase.table("members").update(
                    {"parent_id": parent_uuid}
                ).eq("id", child_uuid).execute()
                linked += 1
            except Exception as e:
                missing.append((m["name"], f"lỗi update: {e}"))

        done += len(batch)
        print(f"Updated {min(done, len(to_update))}/{len(to_update)} parent links...")

    return linked, missing


# --- Thống kê & sanity check -------------------------------------------------

def print_stats(supabase: Client, members, id_map, insert_failed, linked, link_warnings):
    print("\n================ THỐNG KÊ ================")
    print(f"Member trong members.json     : {len(members)}")
    print(f"Member đã insert (có uuid)    : {len(id_map)}")
    print(f"Member insert THẤT BẠI        : {len(insert_failed)}")
    for m in insert_failed:
        print(f"   - {m.get('name')} (id_temp={m.get('id_temp')})")

    # Đếm trực tiếp trên DB cho chính xác
    try:
        with_parent = supabase.table("members").select(
            "id", count="exact"
        ).not_.is_("parent_id", "null").execute()
        roots = supabase.table("members").select(
            "id", count="exact"
        ).is_("parent_id", "null").execute()
        total_db = supabase.table("members").select("id", count="exact").execute()
        print(f"\nTrên Supabase:")
        print(f"   Tổng member               : {total_db.count}")
        print(f"   Có parent_id (đã link)    : {with_parent.count}")
        print(f"   Là gốc (parent_id = null) : {roots.count}")
    except Exception as e:
        print(f"CẢNH BÁO: không đếm được trên DB: {e}", file=sys.stderr)

    print(f"\nParent link cập nhật trong phiên này: {linked}")
    if link_warnings:
        print(f"Cảnh báo link parent ({len(link_warnings)}):")
        for name, reason in link_warnings:
            print(f"   - {name}: {reason}")

    # Sanity: query thử 3 member
    print("\n================ SANITY CHECK (3 member từ Supabase) ================")
    try:
        sample = supabase.table("members").select(
            "id,name,han_name,generation,parent_id"
        ).limit(3).execute()
        for row in sample.data:
            print(json.dumps(row, ensure_ascii=False, indent=2))
            print("-" * 40)
    except Exception as e:
        print(f"CẢNH BÁO: không query được sample: {e}", file=sys.stderr)


# --- Main --------------------------------------------------------------------

def main():
    if not os.path.exists(MEMBERS_JSON):
        print(f"LỖI: không tìm thấy {MEMBERS_JSON}", file=sys.stderr)
        sys.exit(1)

    with open(MEMBERS_JSON, encoding="utf-8") as f:
        members = json.load(f)

    supabase = get_client()

    # Bước 1
    id_map, insert_failed = step1_insert(supabase, members)
    # Bước 2
    linked, link_warnings = step2_update_parents(supabase, members, id_map)
    # Thống kê
    print_stats(supabase, members, id_map, insert_failed, linked, link_warnings)

    print("\n✅ Hoàn tất seed dữ liệu lên Supabase.")


if __name__ == "__main__":
    main()
