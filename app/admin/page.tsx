"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';

export default function AdminPage() {
  const [shifts, setShifts] = useState<any[]>([]);
  // 修正中のIDと、その修正内容を保持するステート
  const [editId, setEditId] = useState<number | null>(null);
  const [editTime, setEditTime] = useState("");

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('date', { ascending: true });
    if (error) console.error(error);
    else setShifts(data || []);
  };

  // 承認処理
  const handleApprove = async (id: number) => {
    await supabase.from('shifts').update({ status: 'approved' }).eq('id', id);
    fetchShifts();
  };

  // 削除処理
  const handleDelete = async (id: number) => {
    if (!confirm("本当に削除しますか？")) return;
    await supabase.from('shifts').delete().eq('id', id);
    fetchShifts();
  };

  // 修正開始
  const startEdit = (id: number, currentTime: string) => {
    setEditId(id);
    setEditTime(currentTime);
  };

  // 修正保存
  const handleUpdate = async (id: number) => {
    const { error } = await supabase
      .from('shifts')
      .update({ start_time: editTime })
      .eq('id', id);
    
    if (error) {
      alert("修正に失敗しました");
    } else {
      setEditId(null);
      fetchShifts();
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">シフト管理（承認・修正・削除）</h1>
      <div className="space-y-2">
        {shifts.map((shift) => (
          <div key={shift.id} className="border p-3 rounded flex justify-between items-center bg-white shadow-sm">
            <div>
              <span className="font-bold">{shift.date}</span>
              <span className="ml-2 bg-gray-100 px-2 py-1 rounded text-sm">{shift.staff_name}</span>
              
              {/* 修正モードかどうかの切り替え */}
              {editId === shift.id ? (
                <input 
                  type="text" 
                  value={editTime} 
                  onChange={(e) => setEditTime(e.target.value)}
                  className="ml-2 border border-blue-400 p-1 w-20 rounded"
                />
              ) : (
                <span className="ml-2 text-blue-600 font-mono">{shift.start_time}〜</span>
              )}
              
              <span className={`ml-2 text-xs ${shift.status === 'approved' ? 'text-green-600' : 'text-orange-500'}`}>
                {shift.status === 'approved' ? '●確定' : '●申請中'}
              </span>
            </div>

            <div className="flex gap-2">
              {shift.status === 'pending' && (
                <button onClick={() => handleApprove(shift.id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm">承認</button>
              )}
              
              {editId === shift.id ? (
                <button onClick={() => handleUpdate(shift.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">保存</button>
              ) : (
                <button onClick={() => startEdit(shift.id, shift.start_time)} className="bg-gray-500 text-white px-3 py-1 rounded text-sm">修正</button>
              )}

              <button onClick={() => handleDelete(shift.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm">削除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}