"use client";
import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      background: '#fff9e6', // ニコニコレンタカーらしい明るい黄色系
      fontFamily: 'sans-serif',
      padding: '20px'
    }}>
      <div style={{ 
        background: '#fff', 
        padding: '40px 20px', 
        borderRadius: '25px', 
        boxShadow: '0 8px 30px rgba(255, 204, 0, 0.2)', 
        width: '100%', 
        maxWidth: '450px', 
        textAlign: 'center',
        border: '2px solid #ffcc00'
      }}>
        <h1 style={{ color: '#d32f2f', marginBottom: '8px', fontSize: '1.8rem', fontWeight: 'bold' }}>
          ニコニコレンタカー
        </h1>
        <p style={{ color: '#555', marginBottom: '35px', fontSize: '1rem', fontWeight: 'bold' }}>
          シフト管理システム
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* 1. 閲覧用 */}
          <Link href="/view" style={{ textDecoration: 'none' }}>
            <div style={{ 
              background: '#4caf50', 
              color: '#fff', 
              padding: '18px', 
              borderRadius: '15px', 
              fontWeight: 'bold',
              fontSize: '1.1rem',
              boxShadow: '0 4px 6px rgba(76, 175, 80, 0.2)'
            }}>
              📅 確定シフトを確認する
            </div>
          </Link>

          {/* 2. 申請用 */}
          <Link href="/calendar" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#0288d1',
              color: '#fff',
              padding: '18px',
              borderRadius: '15px',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              boxShadow: '0 4px 6px rgba(2, 136, 209, 0.2)'
            }}>
              ✏️ シフト希望を出す
            </div>
          </Link>

          {/* 3. 出退勤 */}
          <Link href="/attendance" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#e53935',
              color: '#fff',
              padding: '18px',
              borderRadius: '15px',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              boxShadow: '0 4px 6px rgba(229, 57, 53, 0.2)'
            }}>
              🕐 出退勤を打刻する
            </div>
          </Link>

          {/* 4. 店前配置 */}
          <Link href="/haisha" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#f9a825',
              color: '#fff',
              padding: '18px',
              borderRadius: '15px',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              boxShadow: '0 4px 6px rgba(249, 168, 37, 0.25)'
            }}>
              🅿️ 店前の配置を決める
            </div>
          </Link>

          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '10px 0' }} />

          {/* 5. 管理者用 */}
          <Link href="/admin" style={{ textDecoration: 'none' }}>
            <div style={{ 
              background: '#333', 
              color: '#fff', 
              padding: '15px', 
              borderRadius: '15px', 
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>
              ⚙️ 店長・管理者用
            </div>
          </Link>
        </div>

        <div style={{ marginTop: '40px', fontSize: '0.8rem', color: '#999', fontWeight: 'bold' }}>
          今日も一日安全運転で！
        </div>
      </div>
    </div>
  );
}