"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';

export default function ViewOnlyCalendar() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [cur, setCur] = useState(new Date());
  const [load, setLoad] = useState(true);

  const Y = cur.getFullYear();
  const M = cur.getMonth();
  const days = ["日", "月", "火", "水", "木", "金", "土"];

  const getS = async (year: number, month: number) => {
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;
    const { data } = await supabase
      .from('shifts')
      .select('*')
      .eq('status', 'approved')
      .gte('date', from)
      .lte('date', to);
    setShifts(data || []);
    setLoad(false);
  };

  useEffect(() => { getS(Y, M); }, [Y, M]);

  const getC = (n: string) => {
    const c: any = {
      "池田 和也":['#e6f4ff','#0958d9'], "森 美妃":['#f6ffed','#389e0d'],
      "岩崎 千久彩":['#fff7e6','#d46b08'], "園田 清子":['#fff0f6','#c41d7f'],
      "檜木 万琳":['#f9f0ff','#531dab']
    };
    return c[n] || ['#f5f5f5','#595959'];
  };

  const dates: (number | null)[] = [];
  const first = new Date(Y, M, 1).getDay();
  const last = new Date(Y, M + 1, 0).getDate();
  for (let i = 0; i < first; i++) dates.push(null);
  for (let d = 1; d <= last; d++) dates.push(d);
  const rows = [];
  for (let i = 0; i < dates.length; i += 7) rows.push(dates.slice(i, i + 7));

  if (load) return <div style={{padding:'20px'}}>読み込み中...</div>;

  return (
    <div style={{ padding: '15px', fontFamily: 'sans-serif', background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', maxWidth: '850px', margin: '0 auto', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <button onClick={() => setCur(new Date(Y, M - 1))} style={btnNavStyle}>＜ 前月</button>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1a365d' }}>{Y}年 {M + 1}月 確定シフト</h2>
          <button onClick={() => setCur(new Date(Y, M + 1))} style={btnNavStyle}>次月 ＞</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>{days.map((d, i) => (<th key={d} style={{ padding: '10px', fontSize: '0.8rem', color: i === 0 ? '#e53e3e' : i === 6 ? '#3182ce' : '#333' }}>{d}</th>))}</tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((d, ci) => {
                  const dS = d ? `${Y}-${String(M+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` : null;
                  const sList = shifts.filter(s => s.date === dS);
                  return (
                    <td key={ci} style={{ height: '80px', verticalAlign: 'top', padding: '4px', borderBottom: '1px solid #edf2f7', background: d ? '#fff' : '#f9f9f9' }}>
                      <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#718096' }}>{d}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {sList.map(s => {
                          const color = getC(s.staff_name);
                          return (
                            <div key={s.id} style={{ fontSize: '0.6rem', background: color[0], color: color[1], padding: '2px', borderRadius: '4px', textAlign: 'center' }}>
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
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link href="/"><button style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}>メニューに戻る</button></Link>
        </div>
      </div>
    </div>
  );
}

const btnNavStyle = { padding: '6px 12px', background: '#fff', border: '1px solid #dcdfe6', borderRadius: '8px', cursor: 'pointer' };
