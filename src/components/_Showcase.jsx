// XEM TRƯỚC TẠM THỜI các component dùng lại (sẽ bị thay bằng màn thật ở bước sau).
import { useMemo, useState } from 'react'
import members from '../../members.json'
import { loadMembers, byId, getChildren, parseDetails } from '../data/genealogy'
import Badge from './ui/Badge'
import Field from './ui/Field'
import EmptyState from './ui/EmptyState'
import MemberRow from './MemberRow'
import DetailPanel from './DetailPanel'

loadMembers(members)

function Section({ title, children }) {
  return (
    <section className="rounded-card border border-hairline bg-card p-5">
      <h2 className="font-heading text-xl text-fg">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export default function Showcase() {
  const [name, setName] = useState('')
  const [gen] = useState('5')

  const rows = useMemo(
    () =>
      ['ngo-phuc-khang', 'ngo-ba-dat', 'ngo-kham', 'ngo-kieu', 'ngo-nghiem']
        .map((id) => byId(id))
        .filter(Boolean),
    []
  )
  const depthOf = { 'ngo-phuc-khang': 0, 'ngo-ba-dat': 1, 'ngo-kham': 2, 'ngo-kieu': 2, 'ngo-nghiem': 2 }

  return (
    <div className="mx-auto max-w-5xl px-5 py-6">
      <div className="mb-5 rounded-btn bg-muted px-4 py-2 text-sm text-fg-2">
        Xem trước component dùng lại (tạm thời) — sẽ thay bằng màn thật ở các bước sau.
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Badge — chip đời & trạng thái">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Đời 1</Badge>
            <Badge>Đời 4</Badge>
            <Badge tone="alive" dot>
              Đang sống
            </Badge>
            <Badge tone="accent-soft">Con trưởng</Badge>
            <Badge tone="muted">Hưởng thọ 74 tuổi</Badge>
            <Badge tone="danger">Thất lạc</Badge>
          </div>
        </Section>

        <Section title="Field — ô nhập">
          <div className="flex flex-col gap-3">
            <Field label="Họ và tên" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập nội dung…" />
            <Field
              label="Đời thứ"
              as="input"
              value={gen}
              locked
              hint="Tự động = đời cha + 1"
            />
            <Field label="Quan hệ" as="select" value="con-trai" options={[{ value: 'con-trai', label: 'Con trai' }, { value: 'con-gai', label: 'Con gái' }]} />
          </div>
        </Section>

        <Section title="MemberRow — dòng outline">
          <div className="rounded-card border border-hairline bg-card p-2">
            {rows.map((m) => (
              <MemberRow
                key={m.id_temp}
                member={m}
                depth={depthOf[m.id_temp] ?? 0}
                hasChildren={getChildren(m.id_temp).length > 0}
                expanded={getChildren(m.id_temp).length > 0}
                active={m.id_temp === 'ngo-ba-dat'}
                isLost={parseDetails(m.details).isLost}
              />
            ))}
          </div>
        </Section>

        <Section title="EmptyState">
          <EmptyState
            icon="users"
            title="Chưa có người con nào được ghi nhận"
            description="Khi thành viên có con cháu, hãy bổ sung để nối tiếp phả hệ dòng họ."
            actionLabel="Thêm người con"
          />
        </Section>
      </div>

      <div className="mt-5">
        <h2 className="mb-3 font-heading text-xl text-fg">DetailPanel — hồ sơ (Ngô Bá Đạt)</h2>
        <div className="max-w-sm">
          <DetailPanel member={byId('ngo-ba-dat')} />
        </div>
      </div>
    </div>
  )
}
