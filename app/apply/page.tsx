"use client";
import React, { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

export default function ApplyPage() {
  const router = useRouter();
  const [cur, setCur] = useState(new Date());
  const [selDate, setSelDate] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', hour: '09', min: '00' });

  const Y = cur.getFullYear();
  const M = cur.getMonth();
  const days = ["日", "月", "火", "水", "木", "金", "土"];

  // カレンダー計算
  const first = new Date(Y, M, 1).getDay();
  const last = new Date(Y, M + 1, 0).getDate();
  const dates = [];
  for (let i = 0; i < first; i++) dates.push(null);
  for (let d = 1; d <= last; d++) dates.push(d);
  const rows = [];
  for (let i = 0; i < dates.length; i += 7) rows.push(dates.slice(i, i + 7));

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selDate) return;

const { error } = await supabase.from('shifts').insert([{ 
  staff_name: form.name, 
  date: selDate, 
  start_time: `${form.hour}:${form.min}`, 
  end_time: '17:00', 
  status: 'pending' 
}]);

    if (error) {
      alert("エラーが発生しました: " + error.message);
    } else {
      alert("申請が完了しました！");
      setSelDate(null);
    }
  };

  return (
    <div style={{ padding: '20px', background: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <button onClick={() => router.push('/')} style={backBtn}>← 戻る</button>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '15px', maxWidth: '800px', margin: '0 auto', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => setCur(new Date(Y, M - 1))} style={navBtn}>前月</button>
          <h2 style={{ margin: 0, color: '#1a365d' }}>{Y}年 {M + 1}月</h2>
          <button onClick={() => setCur(new Date(Y, M + 1))} style={navBtn}>次月</button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {days.map((d, i) => (
                <th key={d} style={{ padding: '10px', color: i === 0 ? 'red' : i === 6 ? 'blue' : '#333' }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((d, ci) => {
                  const dS = d ? `${Y}-${String(M+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` : null;
                  return (
                    <td key={ci} onClick={() => dS && setSelDate(dS)} style={{ height: '70px', border: '1px solid #eee', textAlign: 'center', cursor: d ? 'pointer' : 'default', background: d ? '#fff' : '#f9f9f9' }}>
                      <span style={{ fontWeight: dS === selDate ? 'bold' : 'normal', color: dS === selDate ? '#0070f3' : 'inherit' }}>{d}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 申請モーダル */}
      {selDate && (
        <div style={modalOverlay}>
          <form onSubmit={handleApply} style={modalContent}>
            <h3 style={{ margin: 0 }}>{selDate.replace(/-/g, '/')} の申請</h3>
            
            <label style={labelStyle}>お名前</label>
            <select required value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inputStyle}>
              <option value="">選択してください</option>
              {["池田 和也", "森 美妃", "岩崎 千久彩", "園田 清子", "檜木 万琳", "手塚千晴"].map(n => <option key={n} value={n}>{n}</option>)}
            </select>

            <label style={labelStyle}>出勤時間</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select value={form.hour} onChange={e => setForm({...form, hour: e.target.value})} style={inputStyle}>
                {["08","09","10","11","12","13","14","15","16","17","18"].map(h => <option key={h} value={h}>{h}時</option>)}
              </select>
              <select value={form.min} onChange={e => setForm({...form, min: e.target.value})} style={inputStyle}>
                {["00", "15", "30", "45"].map(m => <option key={m} value={m}>{m}分</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" style={submitBtn}>申請する</button>
              <button type="button" onClick={() => setSelDate(null)} style={cancelBtn}>キャンセル</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const navBtn = { padding: '8px 15px', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' };
const backBtn = { marginBottom: '20px', padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#fff', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 };
const modalContent = { 
  background: '#fff', 
  padding: '30px', 
  borderRadius: '20px', 
  width: '320px', 
  display: 'flex', 
  flexDirection: 'column' as const, // ← ここに「as const」を追加
  gap: '15px' 
};
const inputStyle = { padding: '12px', border: '1px solid #ddd', borderRadius: '10px', width: '100%', fontSize: '1rem' };
const labelStyle = { fontSize: '0.9rem', color: '#666', marginBottom: '-10px' };
const submitBtn = { flex: 1, padding: '12px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const cancelBtn = { flex: 1, padding: '12px', background: '#eee', border: 'none', borderRadius: '10px', cursor: 'pointer' };