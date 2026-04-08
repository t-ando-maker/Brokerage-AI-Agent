import { useState } from 'react';
import CaseCreateForm from './CaseCreateForm';
import styles from './CaseListPane.module.css';

const SIDE_COLOR = {
  '売主側': '#8b5cf6',
  '買主側': '#0ea5e9',
};

export default function CaseListPane({ cases, selectedCaseId, onSelectCase, onCreateCase }) {
  const [showForm, setShowForm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const activeCases    = cases.filter(c => c.status !== '完了');
  const completedCases = cases.filter(c => c.status === '完了');

  return (
    <div className={styles.pane}>
      <div className={styles.header}>
        <span className={styles.title}>業務プロセス一覧</span>
      </div>

      <div className={styles.createBtnWrap}>
        <button className={styles.createBtn} onClick={() => setShowForm(true)}>＋ 業務プロセスを新規生成</button>
      </div>

      <div className={styles.list}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>進行中</span>
          <span className={styles.sectionCount}>{activeCases.length}</span>
        </div>
        {activeCases.length === 0 && <div className={styles.empty}>進行中のプロセスがありません</div>}
        {activeCases.map(c => (
          <div
            key={c.id}
            className={`${styles.caseItem} ${c.id === selectedCaseId ? styles.selected : ''}`}
            onClick={() => onSelectCase(c.id === selectedCaseId ? null : c.id)}
          >
            <span className={styles.sideDot} style={{ background: SIDE_COLOR[c.side] || '#9ca3af' }} />
            <span className={styles.caseName}>{c.name}</span>
          </div>
        ))}

        <div
          className={`${styles.sectionHeader} ${styles.sectionHeaderClickable}`}
          onClick={() => setShowCompleted(v => !v)}
        >
          <span className={styles.sectionLabel}>完了済み</span>
          <span className={styles.sectionCount}>{completedCases.length}</span>
          <span className={styles.toggleIcon}>{showCompleted ? '▲' : '▼'}</span>
        </div>
        {showCompleted ? (
          <>
            {completedCases.length === 0 && <div className={styles.empty}>完了プロセスがありません</div>}
            {completedCases.map(c => (
              <div
                key={c.id}
                className={`${styles.caseItem} ${styles.completedItem} ${c.id === selectedCaseId ? styles.selected : ''}`}
                onClick={() => onSelectCase(c.id === selectedCaseId ? null : c.id)}
              >
                <span className={styles.sideDot} style={{ background: SIDE_COLOR[c.side] || '#9ca3af', opacity: 0.5 }} />
                <span className={styles.caseName}>{c.name}</span>
              </div>
            ))}
          </>
        ) : (
          completedCases.length > 0 && (
            <div className={styles.completedHint} onClick={() => setShowCompleted(true)}>
              📁 {completedCases.length}件の完了済みプロセスを表示する
            </div>
          )
        )}
      </div>

      {showForm && (
        <CaseCreateForm onSubmit={data => { onCreateCase(data); setShowForm(false); }} onCancel={() => setShowForm(false)} />
      )}
    </div>
  );
}
