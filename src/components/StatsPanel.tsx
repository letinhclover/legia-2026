import { Member } from '../types';
import { X, Users, UserCheck, Heart, TrendingUp } from 'lucide-react';

interface Props {
  members: Member[];
  onClose: () => void;
  darkMode?: boolean;
}

export default function StatsPanel({ members, onClose, darkMode = false }: Props) {
  // ── Màu theo theme ────────────────────────────────────────────────────────
  const bg       = darkMode ? '#111214'   : '#f8fafc';
  const cardBg   = darkMode ? '#1d1f21'   : '#ffffff';
  const textMain = darkMode ? '#f5f5f5'   : '#0b0b0b';
  const textSub  = darkMode ? '#c0c0c0'   : '#3d3d3d';
  const border   = darkMode ? '#2d3748'   : '#e2e8f0';
  const headerBg = 'linear-gradient(135deg, #CC0000, #dd2476)';

  // ── Thống kê ──────────────────────────────────────────────────────────────
  const alive    = members.filter(m => !m.deathDate).length;
  const deceased = members.filter(m => !!m.deathDate).length;
  const male     = members.filter(m => m.gender === 'Nam').length;
  const female   = members.filter(m => m.gender === 'Nữ').length;
  const maxGen   = Math.max(...members.map(m => m.generation), 0);
  const byGen    = Array.from({ length: maxGen }, (_, i) => ({
    gen:    i + 1,
    count:  members.filter(m => m.generation === i + 1).length,
    male:   members.filter(m => m.generation === i + 1 && m.gender === 'Nam').length,
    female: members.filter(m => m.generation === i + 1 && m.gender === 'Nữ').length,
  }));
  const married = members.filter(m => m.spouseId).length / 2;
  const malePercent   = members.length ? Math.round(male / members.length * 100) : 0;
  const femalePercent = members.length ? Math.round(female / members.length * 100) : 0;

  // ── Card thống kê ─────────────────────────────────────────────────────────
  const statCards = [
    { icon: <Users size={28} color="#CC0000" />, label: 'Tổng thành viên', value: members.length, accent: darkMode ? '#2a1010' : '#FEF2F2' },
    { icon: <UserCheck size={28} color="#16A34A" />, label: 'Còn sống', value: alive, accent: darkMode ? '#0f2a1a' : '#F0FDF4' },
    { icon: <span style={{ fontSize: 26 }}>🕯️</span>, label: 'Đã mất', value: deceased, accent: darkMode ? '#1a1a1a' : '#F3F4F6' },
    { icon: <Heart size={28} color="#EC4899" />, label: 'Cặp vợ chồng', value: Math.round(married), accent: darkMode ? '#2a0d1a' : '#FDF2F8' },
  ];

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
    >
      <div
        className="rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg overflow-hidden"
        style={{
          background: bg,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center px-5 py-4 flex-shrink-0 sticky top-0 z-10"
          style={{ background: headerBg }}
        >
          <div>
            <h3 style={{ fontFamily: "'Roboto', sans-serif", fontSize: 20, fontWeight: 900, color: 'white' }}>
              📊 Thống kê Dòng Họ
            </h3>
            <p style={{ fontSize: 12, color: '#FCD34D', fontFamily: "'Roboto', sans-serif" }}>
              Gia Phả Dòng Họ Lê
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: '50%',
              width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={22} color="white" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Tổng quan 2x2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {statCards.map(c => (
              <div
                key={c.label}
                style={{
                  background: c.accent,
                  borderRadius: 18,
                  padding: '16px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  border: `1px solid ${border}`,
                }}
              >
                <div style={{ fontSize: 28 }}>{c.icon}</div>
                <div>
                  <div style={{
                    fontSize: 30, fontWeight: 900, color: textMain,
                    fontFamily: "'Roboto', sans-serif", lineHeight: 1,
                  }}>
                    {c.value}
                  </div>
                  <div style={{ fontSize: 13, color: textSub, marginTop: 2, fontFamily: "'Roboto', sans-serif" }}>
                    {c.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Nam / Nữ */}
          <div style={{ background: darkMode ? '#1a1c1e' : '#EFF6FF', borderRadius: 18, padding: 16, border: `1px solid ${border}` }}>
            <h4 style={{
              fontWeight: 800, fontSize: 16,
              color: darkMode ? '#93C5FD' : '#1D4ED8',
              marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: "'Roboto', sans-serif",
            }}>
              <TrendingUp size={20} /> Tỷ lệ Nam / Nữ
            </h4>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: darkMode ? '#60A5FA' : '#1D4ED8', fontFamily: "'Roboto', sans-serif" }}>
                  {male}
                </div>
                <div style={{ fontSize: 14, color: textSub, marginTop: 2, fontFamily: "'Roboto', sans-serif" }}>
                  👨 Nam ({malePercent}%)
                </div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: darkMode ? '#F9A8D4' : '#BE185D', fontFamily: "'Roboto', sans-serif" }}>
                  {female}
                </div>
                <div style={{ fontSize: 14, color: textSub, marginTop: 2, fontFamily: "'Roboto', sans-serif" }}>
                  👩 Nữ ({femalePercent}%)
                </div>
              </div>
            </div>
            <div style={{ height: 12, background: darkMode ? '#1d1f21' : '#E0E7FF', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #1D4ED8, #60A5FA)',
                borderRadius: 999,
                width: `${malePercent}%`,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>

          {/* Phân bổ theo đời */}
          <div style={{ background: darkMode ? '#1a1500' : '#FFFBEB', borderRadius: 18, padding: 16, border: `1px solid ${border}` }}>
            <h4 style={{
              fontWeight: 800, fontSize: 16,
              color: darkMode ? '#FCD34D' : '#92400E',
              marginBottom: 14,
              fontFamily: "'Roboto', sans-serif",
            }}>
              📜 Phân bổ theo đời
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {byGen.map(g => (
                <div key={g.gen} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 700,
                    color: textSub, width: 52, flexShrink: 0,
                    fontFamily: "'Roboto', sans-serif",
                  }}>
                    Đời {g.gen}
                  </div>
                  <div style={{
                    flex: 1, height: 28, borderRadius: 999,
                    background: darkMode ? '#1d1f21' : '#FEF3C7',
                    overflow: 'hidden', position: 'relative',
                  }}>
                    <div style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #CC0000, #B8860B)',
                      borderRadius: 999,
                      width: `${members.length > 0 ? Math.round(g.count / members.length * 100) : 0}%`,
                      transition: 'width 0.5s ease',
                      minWidth: g.count > 0 ? 40 : 0,
                    }} />
                    <span style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', padding: '0 10px',
                      fontSize: 13, fontWeight: 700, color: 'white',
                      textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                    }}>
                      {g.count} người ({g.male}♂ {g.female}♀)
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {byGen.length > 0 && (
              <div style={{
                marginTop: 12, fontSize: 13, padding: '8px 12px',
                background: darkMode ? 'rgba(255,200,0,0.08)' : '#FEF3C7',
                borderRadius: 10, color: darkMode ? '#FCD34D' : '#92400E',
                fontFamily: "'Roboto', sans-serif",
              }}>
                Tổng cộng {maxGen} đời — đời đông nhất: Đời{' '}
                <strong>{[...byGen].sort((a, b) => b.count - a.count)[0]?.gen}</strong>{' '}
                ({[...byGen].sort((a, b) => b.count - a.count)[0]?.count} người)
              </div>
            )}
          </div>

          {/* ── BIỂU ĐỒ TUỔI THỌ THEO ĐỜI ── */}
          {(() => {
            const lifespanByGen = byGen.map(g => {
              const withDates = members.filter(m =>
                m.generation === g.gen && m.birthDate && m.deathDate
              );
              if (withDates.length === 0) return null;
              const avg = withDates.reduce((sum, m) => {
                const by = parseInt(m.birthDate!.slice(0, 4));
                const dy = parseInt(m.deathDate!.slice(0, 4));
                return sum + (dy - by);
              }, 0) / withDates.length;
              return { gen: g.gen, avg: Math.round(avg), count: withDates.length };
            }).filter(Boolean) as { gen: number; avg: number; count: number }[];

            if (lifespanByGen.length < 2) return null;
            const maxAvg = Math.max(...lifespanByGen.map(g => g.avg), 1);

            return (
              <div style={{
                marginTop: 20, padding: 18, borderRadius: 20,
                background: cardBg, border: `1px solid ${border}`,
                boxShadow: '0 2px 10px rgba(28,20,16,0.06)',
              }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: textMain, marginBottom: 14, fontFamily: "'Roboto', sans-serif" }}>
                  🕰️ Tuổi thọ trung bình theo đời
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {lifespanByGen.map(g => (
                    <div key={g.gen}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: textSub, fontFamily: "'Roboto', sans-serif" }}>
                          Đời {g.gen}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#CC0000', fontFamily: "'Roboto', sans-serif" }}>
                          {g.avg} tuổi <span style={{ color: textSub, fontWeight: 400 }}>({g.count} người)</span>
                        </span>
                      </div>
                      <div style={{ height: 10, borderRadius: 99, background: darkMode ? '#2d3748' : '#F3F4F6', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 99,
                          width: `${Math.round(g.avg / maxAvg * 100)}%`,
                          background: g.avg >= 70
                            ? 'linear-gradient(90deg, #16A34A, #22C55E)'
                            : g.avg >= 50
                            ? 'linear-gradient(90deg, #D97706, #F59E0B)'
                            : 'linear-gradient(90deg, #CC0000, #EF4444)',
                          transition: 'width 0.8s ease',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: textSub, marginTop: 10, fontStyle: 'italic', fontFamily: "'Roboto', sans-serif" }}>
                  * Chỉ tính thành viên có đủ ngày sinh & ngày mất
                </p>
              </div>
            );
          })()}

          <div style={{ height: 16 }} />
        </div>
      </div>
    </div>
  );
}
