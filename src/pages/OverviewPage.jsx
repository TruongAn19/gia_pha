import { useMemo, useState } from 'react'
import members from '../../members.json'
import { loadMembers, allMembers, groupByGeneration } from '../data/genealogy'
import Icon from '../components/ui/Icon'
import LoiTuaModal from '../components/LoiTuaModal'

loadMembers(members) // idempotent

// Lời tựa (trích từ gia phả gốc)
export const PREFACE = [
  'Sau mấy mươi năm, gián đoạn về thời gian, trăn trở về cách làm… Nhưng những năm gần đây, ơn nhờ anh linh của Tổ tiên đã linh ứng, chỉ đường hướng lối cho hậu duệ của gia tộc, tiếp tục được công việc biên soạn nối tiếp gia phả của Dòng họ.',
  'Kể từ ngày cụ Ngô Phúc Khang, Thủy tổ của họ Ngô Phú Cốc, khoảng đời vua Lê Hy Tông (1681-1705); đến vùng đất này, khai phá đất hoang cuốc đất, lập nền, dựng nhà, gieo lúa trồng khoai, sinh con, đẻ cháu… đến nay đã là 14 đời, hậu duệ đã có tới mấy trăm hộ gia đình, đông đúc con cháu đang sinh cơ lập nghiệp ở quê hương và nhiều vùng của đất nước.',
  'Theo thời gian, một số dòng họ cũng tụ cư về đây, cùng với họ Ngô, chung sức đồng lòng xây dựng nên làng Phú Liễn xưa, làng Phú Cốc bây giờ có truyền thống văn hóa và trù phú như ngày nay.',
  'Việc biên soạn cuốn gia phả của dòng họ Ngô thôn Phú Cốc vừa là đáp ứng nguyện vọng và nhu cầu của mọi thành viên xa gần của gia tộc, bởi nhẽ “Quốc phải có sử biên”, “Họ phải có phả hệ” và cũng là thực hiện lời dặn lại của cụ Tổng sư Trần Ngỗi, năm 1941, khi dịch bản ghi chép của các cụ đời trước, từ chữ nho sang chữ quốc ngữ…',
  'Đọc và càng thấm thía ý nghĩa bốn chữ ghi trên bức Đại tự Nhà thờ Họ: “Hữu khai tất tiên”, có nghĩa là, con cháu được như ngày hôm nay là nhờ có sự mở mang, dạy giỗ, phúc ấm… của Tổ tiên.',
]

const VAN_TE =
  'Kính thưa Tiên Tổ! Tại tích tự cổ, Thế ngô tư thổ, Quyết nghiệp duy hà, Canh độc trì gia, Thùy dụ duy ba, Sử ngã Tử Tôn, Ký phú thả phồn, Thế hùng tư thôn, Xuân tửu ký thanh, Thử tắc duy hinh, Tùy viễn tương thành, Thần từ cách tư, Mặc dụ lai tư, Phúc lộc thị nghi. Cẩn cốc.'

export default function OverviewPage({ dataVersion = 0 }) {
  const [loiTua, setLoiTua] = useState(false)
  // Đếm ĐỘNG từ dữ liệu — tự tăng khi thêm đời/thành viên (theo dataVersion)
  const total = useMemo(() => allMembers().length, [dataVersion])
  const genCount = useMemo(
    () => [...groupByGeneration().keys()].filter((g) => g != null).length,
    [dataVersion]
  )

  const stats = [
    { icon: 'layers', n: genCount, label: 'Đời' },
    { icon: 'users', n: total, label: 'Thành viên đã ghi' },
    { icon: 'hourglass', n: '300+', label: 'Năm truyền thừa' },
    { icon: 'shield', n: 13, label: 'Liệt sỹ' },
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Header trang */}
      <header className="shrink-0 border-b border-hairline bg-card px-5 py-5 md:px-8">
        <h1 className="font-heading text-2xl text-fg">Tổng quan</h1>
        <p className="mt-0.5 text-sm text-fg-2">Giới thiệu chung về dòng họ và lời mở đầu gia phả</p>
      </header>

      {/* Nội dung cuộn */}
      <div className="gp-scroll min-h-0 flex-1 overflow-y-auto px-5 py-6 pb-24 md:px-8 lg:pb-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          {/* Hero */}
          <section className="flex flex-col gap-3.5 rounded-card bg-inverse p-7 text-fg-inv md:p-9">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent font-han text-xl text-fg-inv">
                吳
              </span>
              <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-accent-soft">
                Phú Cốc · Lương Bằng · Hưng Yên
              </span>
            </div>
            <h2 className="font-heading text-3xl leading-tight md:text-4xl">Gia Phả Dòng Họ Ngô</h2>
            <p className="max-w-3xl text-[20px] leading-relaxed text-[#D8D3C7]">
              Khởi tổ: Cụ Ngô Phúc Khang — đến vùng đất này khoảng đời vua Lê Hy Tông (1681–1705),
              khai cơ lập nghiệp. Trải hơn 300 năm, {genCount} đời, con cháu nay đã có tới mấy trăm hộ gia đình.
            </p>
            <p className="text-xs text-fg-inv-2">
              Soạn dịch 1941 (Tổng sư Trần Ngỗi) · Nối tiếp 1983 (Ngô Thế Lộng, đời X) · 2020 (Ngô Hữu Tình, đời XI)
            </p>
          </section>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col gap-1.5 rounded-card border border-hairline bg-card p-5">
                <div className="flex items-center gap-2">
                  <Icon name={s.icon} size={16} className="text-accent" />
                  <span className="font-heading text-2xl text-fg">{s.n}</span>
                </div>
                <span className="text-[13px] text-fg-2">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Phần mở đầu */}
          <section className="rounded-card border border-hairline bg-card p-6 md:p-8">
            <div className="flex items-center gap-2.5">
              <Icon name="book" size={19} className="text-accent" />
              <h3 className="font-heading text-xl text-fg">Phần mở đầu</h3>
            </div>
            <div className="mt-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">
              Nối tiếp ông, cha biên gia phả
            </div>
            <div className="mt-3 h-0.5 w-16 bg-accent-soft" />
            <div className="mt-4 flex flex-col gap-4 font-serif text-[20px] leading-[36px] text-fg">
              {PREFACE.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs italic text-fg-2">Trích Lời tựa — Ngày 15 tháng 8 năm 2020</span>
              <button
                onClick={() => setLoiTua(true)}
                className="flex items-center gap-2 rounded-btn border border-hairline bg-card px-4 py-2.5 text-[13px] font-semibold text-fg hover:bg-muted"
              >
                <Icon name="book" size={15} className="text-accent" /> Xem toàn văn lời tựa
              </button>
            </div>
          </section>

          {/* Bài văn tế Tiên Tổ */}
          <section className="rounded-card border border-hairline bg-card p-6 md:p-8">
            <div className="flex items-center gap-2.5">
              <Icon name="flame" size={19} className="text-accent" />
              <h3 className="font-heading text-xl text-fg">Bài văn tế Tiên Tổ</h3>
            </div>
            <div className="mt-4 flex flex-col items-center gap-4 rounded-card border border-hairline bg-surface px-6 py-8 text-center md:px-12">
              <Icon name="flame" size={22} className="text-accent-soft" />
              <p className="font-serif text-[20px] italic leading-[38px] text-fg">{VAN_TE}</p>
              <p className="text-xs italic text-fg-2">(Bài văn này cụ Tú tài làng Thổ Hoàng tên là Tiến soạn)</p>
            </div>
          </section>
        </div>
      </div>

      <LoiTuaModal open={loiTua} onClose={() => setLoiTua(false)} paragraphs={PREFACE} />
    </div>
  )
}
