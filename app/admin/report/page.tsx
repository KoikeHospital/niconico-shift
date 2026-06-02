"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import * as XLSX from 'xlsx';

const STAFF = ["池田 和也", "森 美妃", "岩崎 千久彩", "園田 清子", "檜木 万琳"];

type AttendanceRecord = {
  id: number;
  staff_name: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
};

export default function ReportPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [pass, setPass] = useState('');
  const [isAuth, setIsAuth] = useState(false);

  const checkPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === 'niconico') setIsAuth(true);
    else { alert('パスワードが違います'); setPass(''); }
  };

  const fetchRecords = async () => {
    setLoading(true);
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .gte('date', from)
      .lte('date', to)
      .order('staff_name')
      .order('date');
    setRecords(data || []);
    setLoading(false);
  };

  useEffect(() => { if (isAuth) fetchRecords(); }, [isAuth, year, month]);

  const formatTime = (iso: string | null) => {
    if (!iso) return '--:--';
    return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  const calcMinutes = (r: AttendanceRecord) => {
    if (!r.clock_in || !r.clock_out) return null;
    return Math.floor((new Date(r.clock_out).getTime() - new Date(r.clock_in).getTime()) / 60000);
  };

  const formatHours = (minutes: number | null) => {
    if (minutes === null) return '-';
    return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}m`;
  };

  const groupByStaff = () => {
    return STAFF.map(name => {
      const staffRecords = records.filter(r => r.staff_name === name);
      const totalMin = staffRecords.reduce((sum, r) => sum + (calcMinutes(r) ?? 0), 0);
      return { name, records: staffRecords, totalMin };
    }).filter(g => g.records.length > 0);
  };

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();
    const groups = groupByStaff();

    // シート1: 全スタッフ一覧
    const allRows: (string | number)[][] = [
      [`${year}年${month}月 勤怠レポート`],
      [],
      ['スタッフ名', '日付', '曜日', '出勤時刻', '退勤時刻', '勤務時間(分)', '勤務時間'],
    ];
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    groups.forEach(g => {
      g.records.forEach(r => {
        const d = new Date(r.date);
        const min = calcMinutes(r);
        allRows.push([
          r.staff_name,
          r.date,
          weekdays[d.getDay()],
          formatTime(r.clock_in),
          formatTime(r.clock_out),
          min ?? '',
          formatHours(min),
        ]);
      });
      const totalMin = g.totalMin;
      allRows.push([
        `${g.name} 合計`, '', '', '', '',
        totalMin,
        formatHours(totalMin),
      ]);
      allRows.push([]);
    });

    const ws1 = XLSX.utils.aoa_to_sheet(allRows);
    ws1['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 5 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws1, '全スタッフ');

    // シート2: スタッフ別サマリー
    const summaryRows: (string | number)[][] = [
      [`${year}年${month}月 スタッフ別サマリー`],
      [],
      ['スタッフ名', '出勤日数', '総勤務時間(分)', '総勤務時間'],
    ];
    groups.forEach(g => {
      summaryRows.push([g.name, g.records.length, g.totalMin, formatHours(g.totalMin)]);
    });
    const ws2 = XLSX.utils.aoa_to_sheet(summaryRows);
    ws2['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'サマリー');

    XLSX.writeFile(wb, `勤怠レポート_${year}${String(month).padStart(2, '0')}.xlsx`);
  };

  if (!isAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
        <form onSubmit={checkPass} style={{ background: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <h2 style={{ color: '#1a365d', marginBottom: '20px' }}>管理者ログイン</h2>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="パスワードを入力"
            style={{ padding: '10px', width: '200px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '15px', display: 'block', marginLeft: 'auto', marginRight: 'auto', color: '#333' }} />
          <button type="submit" style={{ background: '#1a365d', color: '#fff', border: 'none', padding: '10px 30px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>ログイン</button>
        </form>
      </div>
    );
  }

  const groups = groupByStaff();

  return (
    <div style={{ padding: '20px', background: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ color: '#1a365d', margin: 0 }}>月次勤怠レポート</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link href="/admin" style={{ color: '#666', fontSize: '0.85rem', textDecoration: 'none' }}>← 管理者トップ</Link>
            <button onClick={() => setIsAuth(false)} style={{ background: '#ccc', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem', color: '#333' }}>ログアウト</button>
          </div>
        </div>

        {/* 月選択 & ダウンロード */}
        <div style={{ background: '#fff', borderRadius: '15px', padding: '20px', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', color: '#333', fontSize: '1rem' }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}年</option>)}
          </select>
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', color: '#333', fontSize: '1rem' }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}月</option>)}
          </select>
          <button onClick={fetchRecords} style={{ padding: '8px 20px', background: '#1a365d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>表示</button>
          <button onClick={downloadExcel} disabled={groups.length === 0}
            style={{ padding: '8px 20px', background: groups.length === 0 ? '#ccc' : '#217346', color: '#fff', border: 'none', borderRadius: '8px', cursor: groups.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
            📥 Excelダウンロード
          </button>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>読み込み中...</div>}

        {!loading && groups.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888', background: '#fff', borderRadius: '15px' }}>
            {year}年{month}月のデータはありません
          </div>
        )}

        {/* スタッフ別テーブル */}
        {!loading && groups.map(g => (
          <div key={g.name} style={{ background: '#fff', borderRadius: '15px', marginBottom: '20px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#1a365d', color: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{g.name}</span>
              <span style={{ fontSize: '0.85rem' }}>出勤日数: {g.records.length}日 ／ 合計: {formatHours(g.totalMin)}</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f7fafc' }}>
                  {['日付', '曜日', '出勤', '退勤', '勤務時間'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.8rem', color: '#718096', borderBottom: '1px solid #edf2f7' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {g.records.map(r => {
                  const d = new Date(r.date);
                  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
                  const wd = d.getDay();
                  const min = calcMinutes(r);
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f0f4f8' }}>
                      <td style={{ padding: '10px 12px', color: '#2d3748', fontSize: '0.9rem' }}>{r.date}</td>
                      <td style={{ padding: '10px 12px', color: wd === 0 ? '#e53e3e' : wd === 6 ? '#3182ce' : '#4a5568', fontSize: '0.9rem', fontWeight: 'bold' }}>{weekdays[wd]}</td>
                      <td style={{ padding: '10px 12px', color: '#2d3748', fontSize: '0.9rem' }}>{formatTime(r.clock_in)}</td>
                      <td style={{ padding: '10px 12px', color: '#2d3748', fontSize: '0.9rem' }}>{formatTime(r.clock_out)}</td>
                      <td style={{ padding: '10px 12px', color: min ? '#2d3748' : '#a0aec0', fontSize: '0.9rem', fontWeight: min ? 'bold' : 'normal' }}>{formatHours(min)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f7fafc' }}>
                  <td colSpan={4} style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1a365d', fontSize: '0.9rem' }}>合計</td>
                  <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1a365d', fontSize: '0.9rem' }}>{formatHours(g.totalMin)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
