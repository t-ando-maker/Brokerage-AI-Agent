import { useState } from 'react';
import styles from './EscalationCard.module.css';

const URGENCY_OPTIONS = ['通常', '急ぎ（3日以内）', '緊急（当日中）'];
const CATEGORY_OPTIONS = ['法令・規制', '契約条件', '物件調査', '住宅ローン', '書類手続き', 'その他'];

const ESCALATE_REASON_LABEL = {
  ai_flagged:   'AIアシスタントが本社確認を推奨と判定しました。',
  not_found:    'AIアシスタントでは回答できない内容でした。',
  bad_rating:   '担当者がAIの回答を「役立たなかった」と評価しました。',
  user_request: '担当者が本社への確認を希望しました。',
};

export default function EscalationCard({ question, aiResponse, escalateReason, caseContext, chatLog = [], onDismiss, onEscalate }) {
  const [urgency, setUrgency] = useState('通常');
  const [category, setCategory] = useState('その他');
  const [generated, setGenerated] = useState(false);

  const chatLogText = chatLog
    .filter(m => m.type !== 'intro')
    .map(m => `[${m.role === 'user' ? '担当者' : 'AI'}] ${m.content.replace(/\n+/g, ' ')}`)
    .join('\n');

  const reasonText = ESCALATE_REASON_LABEL[escalateReason] || 'AIアシスタントへの確認後、本社への確認が必要と判断しました。';

  const aiSection = aiResponse
    ? `▼ AIアシスタントの回答（参考）
${aiResponse}

▼ 本社への確認事項
AIの回答について、以下の観点からご確認をお願いいたします：
・個別案件への適用可否
・最新の法令・通達・社内基準との整合性
・本件における対応方針のご指示`
    : `▼ AIアシスタントの回答
本件についてはAIアシスタントでの回答が困難でした。`;

  const draft = `件名：【${category}】に関する確認（${urgency}）

お世話になっております。

AIアシスタントに確認しましたが、以下の内容について本社への確認が必要と判断しましたため、お問い合わせいたします。
（エスカレーション理由：${reasonText}）

▼ 案件情報
・案件名：${caseContext?.name || '（未選択）'}
・現在工程：${caseContext?.stage || '（不明）'}
・売主/買主区分：${caseContext?.side || '（未選択）'}

▼ 担当者からの質問
${question}

${aiSection}

▼ 緊急度
${urgency}

▼ チャット履歴ログ（問い合わせ時点）
${chatLogText || '（履歴なし）'}

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
            {onEscalate && (
              <button
                className={styles.sendEscalateBtn}
                onClick={() => { onEscalate(question, chatLog); }}
              >
                📨 エスカレーション送信
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
