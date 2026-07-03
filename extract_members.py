# -*- coding: utf-8 -*-
"""
Trích xuất dữ liệu thành viên từ file PDF gia phả dòng họ Ngô (Phú Cốc, Lương Bằng, Hưng Yên)
và xuất ra members.json.

Cách chạy:
    py extract_members.py
    (cần: pip install pdfplumber)

Ghi chú về cấu trúc PDF thực tế (đã khảo sát):
  - Mỗi thành viên có 1 dòng "meta" đứng ngay trước, ví dụ:
        "Cụ Thủy tổ. Tổng số: 1 Số TT: 1"
        "Đời thứ tư. Tổng số: 2 Số TT: 1"
    => Đây là RANH GIỚI đáng tin cậy để tách từng thành viên
       (các trang Mục lục / Index cũng chứa dòng "ĐỜI THỨ ...:" nhưng KHÔNG có dòng meta này).
  - Dòng tiêu đề (header) viết HOA: "CỤ THỦY TỔ: NGÔ PHÚC KHANG" / "ĐỜI THỨ TƯ: NGÔ BÁ ĐẠT".
  - Đời 1..10 dùng CHỮ (HAI, BA, TƯ...), đời 11..14 dùng SỐ ("ĐỜI THỨ 12: ...").
  - Dòng chữ Hán có khoảng trắng giữa các ký tự: "吴 福 康" -> gộp lại "吴福康".
  - Một trang có thể chứa nhiều thành viên; thông tin 1 thành viên có thể trải dài nhiều trang.
"""

import glob
import json
import re
import sys
import unicodedata

import pdfplumber

# Đảm bảo in tiếng Việt / chữ Hán ra console không lỗi encoding trên Windows
sys.stdout.reconfigure(encoding="utf-8")

PDF_GLOB = "Doi01*.pdf"          # đường dẫn file PDF (theo yêu cầu)
OUTPUT_JSON = "members.json"

# Map tên đời (chữ) -> số. Đời 11..14 trong PDF dùng số nên xử lý riêng bằng int().
WORD2NUM = {
    "HAI": 2, "BA": 3, "TƯ": 4, "NĂM": 5, "SÁU": 6, "BẢY": 7,
    "TÁM": 8, "CHÍN": 9, "MƯỜI": 10,
    "MƯỜI MỘT": 11, "MƯỜI HAI": 12, "MƯỜI BA": 13, "MƯỜI BỐN": 14,
}

# --- Regex dùng chung -------------------------------------------------------

# Dòng meta = ranh giới mỗi thành viên
RE_META = re.compile(r"^(?:Cụ Thủy tổ|Đời thứ .+?)\.\s*Tổng số:\s*\d+\s*Số TT:\s*\d+\s*$")

# Dòng tiêu đề viết HOA (phân biệt hoa/thường để loại dòng meta thường)
RE_HEADER = re.compile(r"^(CỤ THỦY TỔ|ĐỜI THỨ\s+(.+?))\s*:\s*(.+)$")

# Các dòng header/footer cần bỏ qua
RE_PAGE_HEADER = re.compile(r"^GIA PHẢ DÒNG HỌ NGÔ")
RE_PAGE_FOOTER = re.compile(r"Làm gia phả bằng VinaBooks")
RE_LEADER_DOTS = re.compile(r"\.{5,}")          # dấu chấm dẫn của Mục lục
RE_HAN = re.compile(r"[一-鿿]")          # ký tự Hán

# "Ngày giỗ: ..." (lấy đến hết dòng), và "Mộ để:/Phần mộ:" (lấy đến hết dòng)
RE_NGAYGIO = re.compile(r"Ngày giỗ:\s*(.*)$")
RE_GRAVE = re.compile(r"(?:Mộ để|Phần mộ)\s*:\s*(.*)$")


# --- Tiện ích ----------------------------------------------------------------

def strip_accents_to_slug(name: str) -> str:
    """Slug hoá họ tên: bỏ dấu tiếng Việt, lowercase, space -> '-'."""
    s = name.strip().lower()
    s = s.replace("đ", "d").replace("Đ", "d")
    # Tách tổ hợp (NFD) rồi loại bỏ các dấu thanh/dấu phụ (combining marks)
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = re.sub(r"[^a-z0-9\s-]", "", s)           # bỏ ký tự lạ còn sót
    s = re.sub(r"\s+", "-", s.strip())            # khoảng trắng -> '-'
    s = re.sub(r"-+", "-", s)
    return s


def title_vn(upper_name: str) -> str:
    """Chuyển tên IN HOA -> dạng Title: 'NGÔ BÁ ĐẠT' -> 'Ngô Bá Đạt'."""
    return " ".join(w.capitalize() for w in upper_name.split())


def parse_generation(header_match) -> int | None:
    """Lấy số đời từ dòng header (hỗ trợ cả chữ lẫn số)."""
    left = header_match.group(1)
    if left == "CỤ THỦY TỔ":
        return 1
    word = (header_match.group(2) or "").strip()
    if word.isdigit():
        return int(word)
    return WORD2NUM.get(word.upper())


# --- Bước 1: Đọc PDF, gom các dòng thuộc vùng thành viên ----------------------

def read_member_lines(pdf_path: str):
    """
    Trả về danh sách dòng (đã làm sạch) chỉ thuộc vùng dữ liệu thành viên.
    Bỏ qua header/footer trang, dòng Mục lục, và mọi trang sau dòng meta cuối cùng.
    """
    raw_pages = []           # list[list[str]] theo từng trang
    last_meta_page = -1
    first_meta_page = None

    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            lines = text.split("\n")
            raw_pages.append(lines)
            for ln in lines:
                if RE_META.match(ln.strip()):
                    if first_meta_page is None:
                        first_meta_page = i
                    last_meta_page = i

    if first_meta_page is None:
        raise RuntimeError("Không tìm thấy dòng meta nào — sai cấu trúc PDF?")

    # Chỉ giữ các trang trong vùng [trang member đầu .. trang meta cuối]
    # => loại bỏ phần mở đầu và phần Mục lục/Index ở cuối.
    cleaned = []
    for i in range(first_meta_page, last_meta_page + 1):
        for ln in raw_pages[i]:
            s = ln.strip()
            if not s:
                continue
            if RE_PAGE_HEADER.match(s):
                continue
            if RE_PAGE_FOOTER.search(s):
                continue
            if RE_LEADER_DOTS.search(s):          # dòng kiểu Mục lục lọt vào
                continue
            cleaned.append(s)
    return cleaned


# --- Bước 2: Tách thành các khối (block) theo dòng meta -----------------------

def split_blocks(lines):
    """Mỗi khối = các dòng từ 1 dòng meta đến ngay trước dòng meta kế tiếp."""
    blocks = []
    current = None
    for ln in lines:
        if RE_META.match(ln):
            if current is not None:
                blocks.append(current)
            current = [ln]            # bắt đầu khối mới (giữ luôn dòng meta ở [0])
        elif current is not None:
            current.append(ln)
    if current is not None:
        blocks.append(current)
    return blocks


# --- Bước 3: Parse 1 khối thành 1 member -------------------------------------

def parse_block(block):
    """
    block[0]  = dòng meta (bỏ)
    block[1]  = dòng header viết HOA -> name, generation
    tiếp theo = (tuỳ chọn) dòng chữ Hán -> han_name
    còn lại   = nội dung: bio, Ngày giỗ, Mộ để, Bà chánh thất, Các con...
    """
    # 3.1 — Tìm dòng header (thường là block[1], nhưng quét cho chắc)
    header_idx = None
    header_match = None
    for idx in range(1, len(block)):
        m = RE_HEADER.match(block[idx])
        if m:
            header_idx, header_match = idx, m
            break
    if header_match is None:
        return None  # khối không có header hợp lệ -> bỏ

    name = title_vn(header_match.group(3).strip())
    generation = parse_generation(header_match)

    # 3.2 — Các dòng nội dung sau header
    body = block[header_idx + 1:]

    # 3.3 — han_name: dòng đầu tiên chứa ký tự Hán -> gộp bỏ khoảng trắng
    han_name = None
    body_wo_han = []
    han_taken = False
    for ln in body:
        if (not han_taken) and RE_HAN.search(ln):
            han_name = re.sub(r"\s+", "", ln)
            han_taken = True
            continue
        body_wo_han.append(ln)
    body = body_wo_han

    # 3.4 — death_anniversary: "Ngày giỗ:" ĐẦU TIÊN của member.
    #        Đồng thời xoá đoạn "Ngày giỗ: ..." khỏi dòng đó để phần còn lại
    #        (vd phần tiểu sử đứng trước) vẫn nằm trong details.
    death_anniversary = None
    new_body = []
    death_taken = False
    for ln in body:
        if not death_taken:
            m = RE_NGAYGIO.search(ln)
            if m:
                death_anniversary = m.group(1).strip().rstrip(".").strip()
                death_taken = True
                prefix = ln[:m.start()].strip()   # giữ phần trước "Ngày giỗ:"
                if prefix:
                    new_body.append(prefix)
                continue
        new_body.append(ln)
    body = new_body

    # 3.5 — grave: dòng "Mộ để:" / "Phần mộ:" ĐẦU TIÊN. Xoá khỏi body.
    grave = None
    new_body = []
    grave_taken = False
    for ln in body:
        if not grave_taken:
            m = RE_GRAVE.search(ln)
            if m:
                grave = m.group(1).strip().rstrip(".").strip()
                grave_taken = True
                prefix = ln[:m.start()].strip()
                if prefix:
                    new_body.append(prefix)
                continue
        new_body.append(ln)
    body = new_body

    # 3.6 — details: phần còn lại, giữ nguyên xuống dòng
    details = "\n".join(body).strip()

    return {
        "id_temp": None,                  # gán ở bước slug
        "name": name,
        "han_name": han_name,
        "generation": generation,
        "death_anniversary": death_anniversary,
        "grave": grave,
        "details": details,
        "photo_url": None,
        "parent_id_temp": None,           # map ở bước cuối
    }


# --- Bước 4: Tạo id_temp duy nhất --------------------------------------------

def assign_ids(members):
    seen = {}
    for m in members:
        base = strip_accents_to_slug(m["name"]) or "unknown"
        if base not in seen:
            seen[base] = 1
            m["id_temp"] = base
        else:
            seen[base] += 1
            m["id_temp"] = f"{base}-{seen[base]}"


# --- Bước 5: Map parent_id_temp qua danh sách "Các con:" ----------------------

def map_parents(members):
    """
    Với mỗi member (cha), tìm trong details đoạn "Các con:" -> phần "con trai"
    (cắt trước "con gái"). Sau đó với mỗi member đời (gen+1) có tên xuất hiện
    trong đoạn đó => gán parent_id_temp = id của cha.
    """
    # gom member theo đời để giới hạn so khớp (con phải ở đời cha + 1)
    by_gen = {}
    for m in members:
        by_gen.setdefault(m["generation"], []).append(m)

    linked = 0
    for parent in members:
        details = parent["details"] or ""
        pos = details.find("Các con")
        if pos == -1:
            continue
        seg = details[pos:]
        # QUAN TRỌNG: gộp \n + khoảng trắng thừa thành 1 space. Trong PDF, danh
        # sách con thường bị NGẮT DÒNG giữa tên (vd "...3. Ngô Văn\nThái"), nếu
        # không gộp thì regex khớp tên con (có space) sẽ trượt -> sót/nhầm cha.
        seg = re.sub(r"\s+", " ", seg)
        # chỉ lấy phần con trai (trước mục "con gái" nếu có)
        gpos = seg.find("con gái")
        if gpos != -1:
            seg = seg[:gpos]

        candidates = by_gen.get((parent["generation"] or 0) + 1, [])
        for child in candidates:
            if child["parent_id_temp"] is not None:
                continue  # đã có cha
            # so khớp tên con như một "từ" trong đoạn (tránh khớp một phần)
            if re.search(r"(?<![^\s.0-9])" + re.escape(child["name"]) + r"(?![^\s,.;)])", seg):
                child["parent_id_temp"] = parent["id_temp"]
                linked += 1
    return linked


# Bắt đầu phần mô tả con: "Là con (trưởng/cả/thứ ...) (của) cụ/ông/bà <Tên cha>"
RE_BIO_PARENT = re.compile(
    r"Là\s+con\b.*?\b(?:cụ|ông|bà)\s+(Ngô[^.,;(\n]+)", re.IGNORECASE
)


def map_parents_by_bio(members):
    """
    BƯỚC BỔ SUNG (fallback) — KHÔNG nằm trong spec gốc, chỉ chạy cho các member
    VẪN chưa có cha sau bước map qua "Các con:".

    Lý do: file PDF gốc ghi tên KHÔNG nhất quán — vd cha liệt kê con là
    "Ngô Văn Lợi" nhưng mục riêng của người con lại đề "Ngô Lợi", khiến cách
    so khớp theo danh sách con thất bại. Tuy nhiên phần tiểu sử của người con
    lại ghi đúng tên cha ("Là con trưởng cụ Ngô Huy Chiếu"), nên ta tận dụng.

    Quy tắc: đọc tiểu sử con -> lấy tên cha -> tìm member tên khớp ở đời (gen-1).
    Chỉ GÁN khi đang None, không bao giờ ghi đè kết quả của bước chính.
    """
    by_gen_name = {}
    for m in members:
        by_gen_name.setdefault((m["generation"], m["name"]), m)

    linked = 0
    for child in members:
        if child["parent_id_temp"] is not None or child["generation"] in (None, 1):
            continue
        m = RE_BIO_PARENT.search(child["details"] or "")
        if not m:
            continue
        parent_name = title_vn(m.group(1).strip())
        parent = by_gen_name.get((child["generation"] - 1, parent_name))
        if parent:
            child["parent_id_temp"] = parent["id_temp"]
            linked += 1
    return linked


# --- Main --------------------------------------------------------------------

def main():
    matches = glob.glob(PDF_GLOB)
    if not matches:
        print(f"Không tìm thấy file PDF khớp '{PDF_GLOB}'", file=sys.stderr)
        sys.exit(1)
    pdf_path = matches[0]
    print(f"Đang đọc: {pdf_path}")

    # 1) Đọc & làm sạch dòng
    lines = read_member_lines(pdf_path)
    # 2) Tách khối
    blocks = split_blocks(lines)
    # 3) Parse từng khối
    members = []
    for b in blocks:
        m = parse_block(b)
        if m and m["name"]:
            members.append(m)
    # 4) id_temp
    assign_ids(members)
    # 5) map cha (chính: qua danh sách "Các con:")
    linked = map_parents(members)
    # 5b) map cha (fallback: qua tiểu sử "Là con ... cụ <Tên cha>") cho phần còn sót
    linked_bio = map_parents_by_bio(members)

    # --- Log thống kê -------------------------------------------------------
    roots = [m for m in members if m["parent_id_temp"] is None]
    with_parent = [m for m in members if m["parent_id_temp"] is not None]
    print("\n================ THỐNG KÊ ================")
    print(f"Tổng số member            : {len(members)}")
    print(f"Member có parent (đã link): {len(with_parent)}")
    print(f"   - link qua 'Các con:'   : {linked}")
    print(f"   - link qua tiểu sử (fb) : {linked_bio}")
    print(f"Member KHÔNG có parent     : {len(roots)} (roots)")
    no_gen = [m for m in members if m["generation"] is None]
    if no_gen:
        print(f"CẢNH BÁO: {len(no_gen)} member không xác định được generation")

    print("\nTop 5 member có details DÀI nhất:")
    for m in sorted(members, key=lambda x: len(x["details"] or ""), reverse=True)[:5]:
        print(f"  - {m['name']} (đời {m['generation']}): {len(m['details'])} ký tự")

    # --- In 3 member mẫu để kiểm tra ---------------------------------------
    print("\n================ 3 MEMBER MẪU ================")
    for m in members[:3]:
        print(json.dumps(m, ensure_ascii=False, indent=2))
        print("-" * 50)

    # --- Ghi file -----------------------------------------------------------
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(members, f, ensure_ascii=False, indent=2)
    print(f"\nĐã ghi {len(members)} member vào '{OUTPUT_JSON}' (UTF-8).")


if __name__ == "__main__":
    main()