"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';

const STAFF = ["池田 和也", "森 美妃", "岩崎 千久彩", "園田 清子", "檜木 万琳"];

type AttendanceRecord = {
  id: number;
  staff_name: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
};

export default function AttendancePage() {
  const [selectedName, setSelectedName] = useState('');
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const today = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD

  const fetchTodayRecord = async (name: string) => {
    if (!name) return;
    setLoading(true);
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('staff_name', name)
      .eq('date', today)
      .maybeSingle();
    setTodayRecord(data || null);
    setLoading(false);
  };

  useEffect(() => {
    fetchTodayRecord(selectedName);
    setMessage('');
  }, [selectedName]);

  const handleClockIn = async () => {
    if (!selectedName) return;
    setLoading(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from('attendance').insert([{
      staff_name: selectedName,
      date: today,
      clock_in: now,
    }]);
    if (error) {
      alert('エラー: ' + error.message);
    } else {
      setMessage('出勤を記録しました！');
      await fetchTodayRecord(selectedName);
    }
    setLoading(false);
  };

  const handleClockOut = async () => {
    if (!todayRecord) return;
    setLoading(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('attendance')
      .update({ clock_out: now })
      .eq('id', todayRecord.id);
    if (error) {
      alert('エラー: ' + error.message);
    } else {
      setMessage('退勤を記録しました！お疲れさまでした！');
      await fetchTodayRecord(selectedName);
    }
    setLoading(false);
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '--:--';
    return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  const calcHours = (record: AttendanceRecord) => {
    if (!record.clock_in || !record.clock_out) return null;
    const diff = new Date(record.clock_out).getTime() - new Date(record.clock_in).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}時間${m}分`;
  };

  const getStatus = () => {
    if (!todayRecord) return 'none';
    if (todayRecord.clock_in && !todayRecord.clock_out) return 'working';
    if (todayRecord.clock_in && todayRecord.clock_out) return 'done';
    return 'none';
  };

  const status = getStatus();

  return (
    <div style={{ minHeight: '100vh', background: '#fff9e6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '25px', boxShadow: '0 8px 30px rgba(255,204,0,0.2)', border: '2px solid #ffcc00', width: '100%', maxWidth: '400px', padding: '30px 25px' }}>

        <h1 style={{ textAlign: 'center', color: '#d32f2f', margin: '0 0 4px', fontSize: '1.5rem', fontWeight: 'bold' }}>ニコニコレンタカー</h1>
        <p style={{ textAlign: 'center', color: '#555', margin: '0 0 25px', fontWeight: 'bold' }}>出退勤打刻</p>

        {/* 今日の日付 */}
        <div style={{ textAlign: 'center', color: '#888', fontSize: '0.9rem', marginBottom: '20px' }}>
          {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
        </div>

        {/* 名前選択 */}
        <select
          value={selectedName}
          onChange={e => setSelectedName(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '1rem', marginBottom: '20px', color: '#333', background: '#fafafa' }}
        >
          <option value="">▼ 名前を選択してください</option>
          {STAFF.map(n => <option key={n} value={n}>{n}</option>)}
        </select>

        {/* ステータス表示 */}
        {selectedName && !loading && (
          <div style={{ marginBottom: '20px' }}>
            {status === 'none' && (
              <div style={{ textAlign: 'center', color: '#888', fontSize: '0.9rem', padding: '10px', background: '#f9f9f9', borderRadius: '10px' }}>
                本日の記録なし
              </div>
            )}
            {status === 'working' && (
              <div style={{ textAlign: 'center', background: '#e6f4ff', borderRadius: '10px', padding: '12px', border: '1px solid #91caff' }}>
                <div style={{ color: '#0958d9', fontWeight: 'bold', fontSize: '0.85rem' }}>出勤中</div>
                <div style={{ color: '#333', marginTop: '4px' }}>出勤 {formatTime(todayRecord?.clock_in ?? null)}</div>
              </div>
            )}
            {status === 'done' && (
              <div style={{ textAlign: 'center', background: '#f6ffed', borderRadius: '10px', padding: '12px', border: '1px solid #b7eb8f' }}>
                <div style={{ color: '#389e0d', fontWeight: 'bold', fontSize: '0.85rem' }}>退勤済み</div>
                <div style={{ color: '#333', marginTop: '4px', fontSize: '0.9rem' }}>
                  出勤 {formatTime(todayRecord?.clock_in ?? null)} 〜 退勤 {formatTime(todayRecord?.clock_out ?? null)}
                </div>
                <div style={{ color: '#389e0d', fontWeight: 'bold', marginTop: '4px' }}>
                  勤務時間: {calcHours(todayRecord!)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* メッセージ */}
        {message && (
          <div style={{ textAlign: 'center', color: '#389e0d', fontWeight: 'bold', marginBottom: '15px', fontSize: '0.95rem' }}>
            {message}
          </div>
        )}

        {/* ボタン */}
        {selectedName && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button
              onClick={handleClockIn}
              disabled={loading || status === 'working' || status === 'done'}
              style={{
                flex: 1, padding: '18px', borderRadius: '12px', border: 'none', cursor: (status === 'working' || status === 'done') ? 'not-allowed' : 'pointer',
                background: (status === 'working' || status === 'done') ? '#eee' : '#0288d1',
                color: (status === 'working' || status === 'done') ? '#aaa' : '#fff',
                fontWeight: 'bold', fontSize: '1.1rem', boxShadow: (status === 'working' || status === 'done') ? 'none' : '0 4px 10px rgba(2,136,209,0.3)'
              }}
            >
              ▶ 出勤
            </button>
            <button
              onClick={handleClockOut}
              disabled={loading || status !== 'working'}
              style={{
                flex: 1, padding: '18px', borderRadius: '12px', border: 'none', cursor: status !== 'working' ? 'not-allowed' : 'pointer',
                background: status !== 'working' ? '#eee' : '#e53935',
                color: status !== 'working' ? '#aaa' : '#fff',
                fontWeight: 'bold', fontSize: '1.1rem', boxShadow: status !== 'working' ? 'none' : '0 4px 10px rgba(229,57,53,0.3)'
              }}
            >
              ■ 退勤
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <Link href="/" style={{ color: '#aaa', fontSize: '0.85rem', textDecoration: 'none' }}>← メニューに戻る</Link>
        </div>
      </div>
    </div>
  );
}
