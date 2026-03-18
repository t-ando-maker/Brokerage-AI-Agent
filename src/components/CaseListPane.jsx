import { useState } from 'react';
import CaseCreateForm from './CaseCreateForm';
import styles from './CaseListPane.module.css';

const STATUS_COLOR = {
  '進行中': '#4f6ef7',
  '要確認': '#f59e0b',
  '完了':   '#10b981',
  '中断':   '#ef4444',
};
const SIDE_COLOR = {
  '売主側': '#8b5cf6',
  '買主側': '#0ea5e9',
};

function CaseSummary({ c }) {
  const currentStage = c.stages[c.currentStageIndex];
  const totalDocs     = c.documents.length;
  const collectedDocs = c.documents.filter(d => d.collected).length;
  const uncollected   = c.documents.filter(d => !d.collected);

  return (
    <div className={styles.summary}>
      {/* 現在工程 */}
      <div className={styles.summaryRow}>
        <span className={styles.summaryLabel}>現在工程</span>
        <span className={styles.summaryValue}>{currentStage?.name || '—'}</span>
      </div>

      {/* 次のアクション */}
      {c.nextActions?.length > 0 && (
        <div className={styles.summarySection}>
          <div className={styles.summaryLabel}>次のアクション</div>
          <ul className={styles.summaryList}>
            {c.nextActions.map((a, i) => (
              <li key={i} className={styles.summaryListItem}>
                <span className={styles.summaryDot} />
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 書類回収状況 */}
      {totalDocs > 0 && (
        <div className={styles.summarySection}>
          <div className={styles.summaryLabelRow}>
            <span className={styles.summaryLabel}>書類回収状況</span>
            <span className={styles.summaryDocCount}
              style={{ color: collectedDocs < totalDocs ? '#b91c1c' : '#065f46' }}
            >
              {collectedDocs}/{totalDocs}
            </span>
          </div>
          {uncollected.length > 0 && (
            <div className={styles.uncollectedList}>
              {uncollected.map((d, i) => (
                <span key={i} className={styles.uncollectedTag}>{d.name}</span>
              ))}
            </div>
          )}
          {uncollected.length === 0 && (
            <div className={styles.allCollected}>✅ すべて回収済み</div>
          )}
        </div>
      )}

      {/* 完了案件メモ */}
      {c.completionNote && (
        <div className={`${styles.summarySection} ${styles.completionNoteSection}`}>
          <div className={styles.summaryLabel}>成約メモ</div>
          <p className={styles.completionNoteText}>{c.completionNote}</p>
        </div>
      )}
    </div>
  );
}

function CaseItem({ c, isSelected, onClick }) {
  const isCompleted = c.status === '完了';
  return (
    <>
      <div
        className={`${styles.caseItem} ${isSelected ? styles.selected : ''} ${isCompleted ? styles.completedItem : ''}`}
        onClick={onClick}
      >
        <div className={styles.caseTop}>
          <span className={styles.caseName}>{c.name}</span>
          <span
            className={styles.statusBadge}
            style={{
              background: (STATUS_COLOR[c.status] || '#9ca3af') + '20',
              color: STATUS_COLOR[c.status] || '#9ca3af',
            }}
          >
            {c.status}
          </span>
        </div>
        <div className={styles.caseMeta}>
          <span className={styles.sideBadge} style={{ background: SIDE_COLOR[c.side] + '18', color: SIDE_COLOR[c.side] }}>
            {c.side}
          </span>
          <span className={styles.propType}>{c.propertyType}</span>
          <span className={styles.price}>{c.price}</span>
        </div>
        {isCompleted
          ? <div className={styles.caseClosedDate}>成約日: {c.closedAt}</div>
          : <div className={styles.caseStageRow}>
              <span className={styles.stageLabel}>現在工程:</span>
              <span className={styles.stageName}>{c.stages[c.currentStageIndex]?.name || '—'}</span>
            </div>
        }
      </div>
      {/* 選択時サマリー展開 */}
      {isSelected && <CaseSummary c={c} />}
    </>
  );
}

export default function CaseListPane({ cases, selectedCaseId, onSelectCase, onCreateCase }) {
  const [showForm, setShowForm]       = useState(false);
  const [search, setSearch]           = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  const activeCases    = cases.filter(c => c.status !== '完了');
  const completedCases = cases.filter(c => c.status === '完了');

  const filterFn = (c) =>
    !search ||
    c.name.includes(search) ||
    c.propertyType.includes(search) ||
    c.side.includes(search) ||
    (c.address || '').includes(search);

  const filteredActive    = activeCases.filter(filterFn);
  const filteredCompleted = completedCases.filter(filterFn);

  return (
    <div className={styles.pane}>
      <div className={styles.header}>
        <span className={styles.title}>案件一覧</span>
        <button className={styles.createBtn} onClick={() => setShowForm(true)}>＋ 新規作成</button>
      </div>

      <div className={styles.searchWrap}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="案件を検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.list}>
        {/* 進行中 */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>進行中</span>
          <span className={styles.sectionCount}>{filteredActive.length}</span>
        </div>
        {filteredActive.length === 0 && <div className={styles.empty}>進行中の案件がありません</div>}
        {filteredActive.map(c => (
          <CaseItem
            key={c.id}
            c={c}
            isSelected={c.id === selectedCaseId}
            onClick={() => onSelectCase(c.id === selectedCaseId ? null : c.id)}
          />
        ))}

        {/* 完了済み */}
        <div
          className={`${styles.sectionHeader} ${styles.sectionHeaderClickable}`}
          onClick={() => setShowCompleted(v => !v)}
        >
          <span className={styles.sectionLabel}>完了済み</span>
          <span className={styles.sectionCount}>{filteredCompleted.length}</span>
          <span className={styles.toggleIcon}>{showCompleted ? '▲' : '▼'}</span>
        </div>
        {showCompleted ? (
          <>
            {filteredCompleted.length === 0 && <div className={styles.empty}>完了案件がありません</div>}
            {filteredCompleted.map(c => (
              <CaseItem
                key={c.id}
                c={c}
                isSelected={c.id === selectedCaseId}
                onClick={() => onSelectCase(c.id === selectedCaseId ? null : c.id)}
              />
            ))}
          </>
        ) : (
          filteredCompleted.length > 0 && (
            <div className={styles.completedHint} onClick={() => setShowCompleted(true)}>
              📁 {filteredCompleted.length}件の完了済み案件を表示する
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
