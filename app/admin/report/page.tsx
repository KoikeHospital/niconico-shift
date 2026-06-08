"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import * as XLSX from 'xlsx';

const STAFF = ["池田 和也", "森 美妃", "岩崎 千久彩", "園田 清子", "檜木 万琳", "冨田 梨菜", "山田 朋枝"];

type AttendanceRecord = {
  id: number;
  staff_name: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
};

// 「N月分」= 前月25日〜当月24日
function getPeriod(year: number, month: number) {
  const fromYear = month === 1 ? year - 1 : year;
  const fromMonth = month === 1 ? 12 : month - 1;
  const from = `${fromYear}-${String(fromMonth).padStart(2, '0')}-25`;
  const to = `${year}-${String(month).padStart(2, '0')}-24`;
  return { from, to };
}

function periodLabel(year: number, month: number) {
  const { from, to } = getPeriod(year, month);
  return `${from} 〜 ${to}`;
}

export default function ReportPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editClockIn, setEditClockIn] = useState('');
  const [editClockOut, setEditClockOut] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    const { from, to } = getPeriod(year, month);
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

  useEffect(() => { fetchRecords(); }, [year, month]);

  const formatTime = (iso: string | null) => {
    if (!iso) return '--:--';
    return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  const toLocalTimeInput = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const calcMinutes = (r: AttendanceRecord) => {
    if (!r.clock_in || !r.clock_out) return null;
    return Math.floor((new Date(r.clock_out).getTime() - new Date(r.clock_in).getTime()) / 60000);
  };

  const formatHours = (minutes: number | null) => {
    if (minutes === null) return '-';
    return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}m`;
  };

  const startEdit = (r: AttendanceRecord) => {
    setEditingRecord(r);
    setEditClockIn(toLocalTimeInput(r.clock_in));
    setEditClockOut(toLocalTimeInput(r.clock_out));
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    setEditLoading(true);
    const toISO = (timeStr: string) => {
      if (!timeStr) return null;
      const [h, m] = timeStr.split(':').map(Number);
      const d = new Date(editingRecord.date);
      d.setHours(h, m, 0, 0);
      return d.toISOString();
    };
    const { error } = await supabase
      .from('attendance')
      .update({ clock_in: toISO(editClockIn), clock_out: toISO(editClockOut) || null })
      .eq('id', editingRecord.id);
    if (error) {
      alert('エラー: ' + error.message);
    } else {
      setEditingRecord(null);
      await fetchRecords();
    }
    setEditLoading(false);
  };

  const handleDelete = async (id: number) => {
    setDeleteLoading(true);
    const { error } = await supabase.from('attendance').delete().eq('id', id);
    if (error) {
      alert('エラー: ' + error.message);
    } else {
      setDeletingId(null);
      await fetchRecords();
    }
    setDeleteLoading(false);
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
    const label = periodLabel(year, month);

    const allRows: (string | number)[][] = [
      [`${year}年${month}月分 勤怠レポート (${label})`],
      [],
      ['スタッフ名', '日付', '曜日', '出勤時刻', '退勤時刻', '勤務時間(分)', '勤務時間'],
    ];
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    groups.forEach(g => {
      g.records.forEach(r => {
        const d = new Date(r.date);
        const min = calcMinutes(r);
        allRows.push([
          r.staff_name, r.date, weekdays[d.getDay()],
          formatTime(r.clock_in), formatTime(r.clock_out),
          min ?? '', formatHours(min),
        ]);
      });
      allRows.push([`${g.name} 合計`, '', '', '', '', g.totalMin, formatHours(g.totalMin)]);
      allRows.push([]);
    });

    const ws1 = XLSX.utils.aoa_to_sheet(allRows);
    ws1['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 5 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws1, '全スタッフ');

    const summaryRows: (string | number)[][] = [
      [`${year}年${month}月分 スタッフ別サマリー`],
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

  const groups = groupByStaff();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div style={{ padding: '20px', background: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ color: '#1a365d', margin: 0 }}>月次勤怠レポート</h2>
          <Link href="/admin" style={{ color: '#666', fontSize: '0.85rem', textDecoration: 'none' }}>← 管理者トップ</Link>
        </div>

        <div style={{ background: '#fff', borderRadius: '15px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', color: '#333', fontSize: '1rem' }}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}年</option>)}
            </select>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', color: '#333', fontSize: '1rem' }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}月分</option>)}
            </select>
            <button onClick={fetchRecords} style={{ padding: '8px 20px', background: '#1a365d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>表示</button>
            <button onClick={downloadExcel} disabled={groups.length === 0}
              style={{ padding: '8px 20px', background: groups.length === 0 ? '#ccc' : '#217346', color: '#fff', border: 'none', borderRadius: '8px', cursor: groups.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
              📥 Excelダウンロード
            </button>
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#718096' }}>
            対象期間：{periodLabel(year, month)}
          </div>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>読み込み中...</div>}

        {!loading && groups.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888', background: '#fff', borderRadius: '15px' }}>
            {year}年{month}月分のデータはありません
          </div>
        )}

        {!loading && groups.map(g => (
          <div key={g.name} style={{ background: '#fff', borderRadius: '15px', marginBottom: '20px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#1a365d', color: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{g.name}</span>
              <span style={{ fontSize: '0.85rem' }}>出勤日数: {g.records.length}日 ／ 合計: {formatHours(g.totalMin)}</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
              <thead>
                <tr style={{ background: '#f7fafc' }}>
                  {['日付', '曜日', '出勤', '退勤', '勤務時間', '操作'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.8rem', color: '#718096', borderBottom: '1px solid #edf2f7' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {g.records.map(r => {
                  const d = new Date(r.date);
                  const wd = d.getDay();
                  const min = calcMinutes(r);
                  const isEditing = editingRecord?.id === r.id;
                  const isDeleting = deletingId === r.id;
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f0f4f8', background: isEditing ? '#fffbe6' : isDeleting ? '#fff1f0' : undefined }}>
                      <td style={{ padding: '10px 12px', color: '#2d3748', fontSize: '0.9rem' }}>{r.date}</td>
                      <td style={{ padding: '10px 12px', color: wd === 0 ? '#e53e3e' : wd === 6 ? '#3182ce' : '#4a5568', fontSize: '0.9rem', fontWeight: 'bold' }}>{weekdays[wd]}</td>

                      {isEditing ? (
                        <>
                          <td style={{ padding: '6px 12px' }}>
                            <input type="time" value={editClockIn} onChange={e => setEditClockIn(e.target.value)}
                              style={{ padding: '4px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem', width: '90px' }} />
                          </td>
                          <td style={{ padding: '6px 12px' }}>
                            <input type="time" value={editClockOut} onChange={e => setEditClockOut(e.target.value)}
                              style={{ padding: '4px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem', width: '90px' }} />
                          </td>
                          <td style={{ padding: '6px 12px', color: '#a0aec0', fontSize: '0.85rem' }}>—</td>
                          <td style={{ padding: '6px 12px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={handleSaveEdit} disabled={editLoading}
                                style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: '#faad14', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
                                保存
                              </button>
                              <button onClick={() => setEditingRecord(null)}
                                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', color: '#555', cursor: 'pointer', fontSize: '0.8rem' }}>
                                取消
                              </button>
                            </div>
                          </td>
                        </>
                      ) : isDeleting ? (
                        <>
                          <td colSpan={2} style={{ padding: '10px 12px', color: '#cf1322', fontSize: '0.85rem', fontWeight: 'bold' }}>この記録を削除しますか？</td>
                          <td style={{ padding: '6px 12px' }} />
                          <td style={{ padding: '6px 12px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => handleDelete(r.id)} disabled={deleteLoading}
                                style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: '#cf1322', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
                                削除
                              </button>
                              <button onClick={() => setDeletingId(null)}
                                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', color: '#555', cursor: 'pointer', fontSize: '0.8rem' }}>
                                取消
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '10px 12px', color: '#2d3748', fontSize: '0.9rem' }}>{formatTime(r.clock_in)}</td>
                          <td style={{ padding: '10px 12px', color: '#2d3748', fontSize: '0.9rem' }}>{formatTime(r.clock_out)}</td>
                          <td style={{ padding: '10px 12px', color: min ? '#2d3748' : '#a0aec0', fontSize: '0.9rem', fontWeight: min ? 'bold' : 'normal' }}>{formatHours(min)}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <button onClick={() => startEdit(r)}
                                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #faad14', background: '#fffbe6', color: '#d48806', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                ✏️ 編集
                              </button>
                              <button onClick={() => setDeletingId(r.id)}
                                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #ffa39e', background: '#fff1f0', color: '#cf1322', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                🗑 削除
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f7fafc' }}>
                  <td colSpan={4} style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1a365d', fontSize: '0.9rem' }}>合計</td>
                  <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1a365d', fontSize: '0.9rem' }}>{formatHours(g.totalMin)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
