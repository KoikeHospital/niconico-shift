"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

export default function AdminPage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [load, setLoad] = useState(true);

  const getS = async () => {
    const { data } = await supabase
      .from('shifts')
      .select('*')
      .eq('status', 'pending')
      .order('date', { ascending: true });
    setShifts(data || []);
    setLoad(false);
  };

  useEffect(() => {
    getS();
  }, []);

  const approveShift = async (id: number) => {
    const { error } = await supabase
      .from('shifts')
      .update({ status: 'approved' })
      .eq('id', id);
    if (!error) {
      alert("承認しました！");
      getS();
    }
  };

  const deleteShift = async (id: number) => {
    if (!confirm("本当に削除しますか？")) return;
    const { error } = await supabase.from('shifts').delete().eq('id', id);
    if (!error) {
      getS();
    }
  };

  if (load) return <div style={{ padding: '20px' }}>読み込み中...</div>;

  return (
    <div style={{ padding: '20px', background: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: '#1a365d', margin: 0 }}>シフト承認待ちリスト</h2>
        <a href="/admin/report" style={{ background: '#217346', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', textDecoration: 'none' }}>📊 月次レポート</a>
      </div>

      {shifts.length === 0 ? (
        <p style={{ color: '#666' }}>現在、承認待ちの申請はありません。</p>
      ) : (
        shifts.map((s) => (
          <div key={s.id} style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#edf2f7', padding: '10px', borderRadius: '10px', textAlign: 'center', minWidth: '60px' }}>
              <div style={{ fontSize: '0.6rem', color: '#718096' }}>DATE</div>
              <div style={{ fontWeight: 'bold', color: '#2d3748' }}>{s.date?.slice(5).replace('-', '/')}</div>
            </div>

            <div style={{ flex: 1, marginLeft: '20px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1a365d', marginBottom: '4px' }}>
                {s.staff_name}
              </div>
              <div style={{ color: '#4a5568', fontSize: '0.9rem' }}>
                {s.start_time?.slice(0, 5)} 〜 {s.end_time?.slice(0, 5)}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={() => approveShift(s.id)} style={{ background: '#52835f', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>承認</button>
              <button onClick={() => deleteShift(s.id)} style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: '0.8rem' }}>削除</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
