"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

export default function ViewPage() {
  const router = useRouter();
  const [shifts, setShifts] = useState<any[]>([]);
  const [cur, setCur] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // --- 追加：詳細表示用のステート ---
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayDetails, setDayDetails] = useState<any[]>([]);

  const Y = cur.getFullYear();
  const M = cur.getMonth();
  const days = ["日", "月", "火", "水", "木", "金", "土"];

  const fetchApprovedShifts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('status', 'approved');
    
    if (error) {
      console.error(error);
    } else {
      setShifts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApprovedShifts();
  }, [cur]);

  const getStaffColor = (name: string) => {
    const colors: any = {
      "池田 和也": { bg: '#e6f4ff', text: '#0958d9' },
      "森 美妃": { bg: '#f6ffed', text: '#389e0d' },
      "岩崎 千久彩": { bg: '#fff7e6', text: '#d46b08' },
      "園田 清子": { bg: '#fff0f6', text: '#c41d7f' },
      "檜木 万琳": { bg: '#f9f0ff', text: '#531dab' },
      "手塚千晴": { bg: '#eafff8', text: '#08979c' }
    };
    return colors[name] || { bg: '#f5f5f5', text: '#595959' };
  };

  const first = new Date(Y, M, 1).getDay();
  const last = new Date(Y, M + 1, 0).getDate();
  const dates = [];
  for (let i = 0; i < first; i++) dates.push(null);
  for (let d = 1; d <= last; d++) dates.push(d);
  const rows = [];
  for (let i = 0; i < dates.length; i += 7) rows.push(dates.slice(i, i + 7));

  // --- 追加：クリック時の処理 ---
  const handleDayClick = (dS: string, shiftsForDay: any[]) => {
    if (!dS) return;
    setSelectedDate(dS);
    setDayDetails(shiftsForDay);
  };

  return (
    <div style={{ padding: '20px', background: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <button onClick={() => router.push('/')} style={backBtn}>← 戻る</button>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', maxWidth: '900px', margin: '0 auto', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => setCur(new Date(Y, M - 1))} style={navBtn}>＜ 前月</button>
          <h2 style={{ margin: 0, color: '#1a365d', fontSize: '1.4rem' }}>{Y}年 {M + 1}月 確定シフト</h2>
          <button onClick={() => setCur(new Date(Y, M + 1))} style={navBtn}>次月 ＞</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>読み込み中...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                {days.map((d, i) => (
                  <th key={d} style={{ padding: '12px', color: i === 0 ? '#e53e3e' : i === 6 ? '#3182ce' : '#718096', fontSize: '0.8rem' }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((d, ci) => {
                    const dS = d ? `${Y}-${String(M+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` : null;
                    const dayShifts = shifts.filter(s => s.date === dS);
                    
                    return (
                      <td 
                        key={ci} 
                        onClick={() => dS && handleDayClick(dS, dayShifts)} // クリックイベント追加
                        style={{ 
                          height: '100px', 
                          border: '1px solid #f0f0f0', 
                          verticalAlign: 'top', 
                          padding: '6px', 
                          background: d ? '#fff' : '#fafafa',
                          cursor: d ? 'pointer' : 'default' // 指マークにする
                        }}
                      >
                        <div style={{ fontSize: '0.85rem', marginBottom: '4px', color: '#888' }}>{d}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {dayShifts.map(s => {
                            const style = getStaffColor(s.staff_name);
                            return (
                              <div key={s.id} style={{ 
                                background: style.bg, 
                                color: style.text, 
                                fontSize: '0.65rem', 
                                padding: '3px 4px', 
                                borderRadius: '4px', 
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden'
                              }}>
                                {s.staff_name.split(' ')[0]} {s.start_time.slice(0, 5)}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- 追加：詳細表示用モーダル --- */}
      {selectedDate && (
        <div 
          onClick={() => setSelectedDate(null)} // 背景クリックで閉じる
          style={modalOverlay}
        >
          <div 
            onClick={e => e.stopPropagation()} // 中身クリックでは閉じない
            style={modalContent}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>{selectedDate} の詳細</h3>
              <button onClick={() => setSelectedDate(null)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {dayDetails.length > 0 ? dayDetails.map((s, i) => {
                const style = getStaffColor(s.staff_name);
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: style.bg, borderRadius: '8px', borderLeft: `4px solid ${style.text}` }}>
                    <span style={{ fontWeight: 'bold', color: style.text }}>{s.staff_name}</span>
                    <span style={{ color: style.text }}>{s.start_time.slice(0, 5)} 〜</span>
                  </div>
                );
              }) : (
                <p style={{ textAlign: 'center', color: '#999' }}>予定はありません</p>
              )}
            </div>
            <button onClick={() => setSelectedDate(null)} style={closeBtn}>閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- スタイル追加 ---
const navBtn = { padding: '8px 16px', background: '#fff', border: '1px solid #dcdfe6', borderRadius: '8px', cursor: 'pointer', color: '#606266' };
const backBtn = { marginBottom: '20px', padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#fff', cursor: 'pointer', color: '#606266', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };

const modalOverlay: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
