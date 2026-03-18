import { useState } from 'react';
import styles from './EscalationCard.module.css';

const URGENCY_OPTIONS = ['通常', '急ぎ（3日以内）', '緊急（当日中）'];
const CATEGORY_OPTIONS = ['法令・規制', '契約条件', '物件調査', '住宅ローン', '書類手続き', 'その他'];

export default function EscalationCard({ question, caseContext, onDismiss }) {
  const [urgency, setUrgency] = useState('通常');
  const [category, setCategory] = useState('その他');
  const [generated, setGenerated] = useState(false);

  const draft = `件名：【${category}】に関する確認（${urgency}）

お世話になっております。

以下の件につきまして、ご確認をお願いいたします。

▼ 案件情報
・案件名：${caseContext?.name || '（未選択）'}
・現在工程：${caseContext?.stage || '（不明）'}
・売主/買主区分：${caseContext?.side || '（未選択）'}

▼ 確認したい内容
${question}

▼ 既に確認した内容
・社内ナレッジを確認しましたが、明確な回答が見つかりませんでした。

▼ 緊急度
${urgency}

以上、ご確認のほどよろしくお願いいたします。`;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardIcon}>🏢</span>
        <span className={styles.cardTitle}>本社への問い合わせ</span>
        <button className={styles.dismissBtn} onClick={onDismiss}>✕</button>
      </div>
      <p className={styles.desc}>
        この質問はナレッジベースでは回答が難しい内容です。本社オペレーターへの問い合わせ文面を生成します。
      </p>

      <div className={styles.fields}>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>カテゴリ</label>
          <select className={styles.select} value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORY_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>緊急度</label>
          <select className={styles.select} value={urgency} onChange={e => setUrgency(e.target.value)}>
            {URGENCY_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {!generated ? (
        <button className={styles.generateBtn} onClick={() => setGenerated(true)}>
          問い合わせ文面を生成
        </button>
      ) : (
        <div className={styles.draftWrap}>
          <div className={styles.draftLabel}>問い合わせ下書き</div>
          <pre className={styles.draft}>{draft}</pre>
          <div className={styles.draftActions}>
            <button className={styles.copyBtn} onClick={() => navigator.clipboard?.writeText(draft)}>
              📋 コピー
            </button>
            <button className={styles.mailBtn}>
              ✉️ メールを開く
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
