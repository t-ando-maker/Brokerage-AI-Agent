import { useState, useRef, useCallback, useEffect } from 'react';
import StageList from './StageList';
import StageDetailInline from './StageDetailInline';
import { PROPERTY_TYPES, BROKERAGE_TYPES, CUSTOMER_TYPES, CASE_SIDES } from '../data/dummyData';
import styles from './CaseDashboardPane.module.css';

const STATUS_COLOR = {
  '進行中': { bg: '#dbeafe', text: '#1d4ed8' },
  '要確認': { bg: '#fef3c7', text: '#b45309' },
  '完了':   { bg: '#d1fae5', text: '#065f46' },
  '中断':   { bg: '#fee2e2', text: '#b91c1c' },
};
const SIDE_COLOR = {
  '売主側': { bg: '#ede9fe', text: '#6d28d9' },
  '買主側': { bg: '#e0f2fe', text: '#0369a1' },
};

const MIN_PX = 60;

// ── インライン案件情報編集パネル ──
function CaseInfoEdit({ c, onSave, onCancel }) {
  const [form, setForm] = useState({
    customerName: c.customerName || '',
    location: c.location || '',
    side: c.side || '売主側',
    propertyType: c.propertyType || '',
    price: c.price || '',
    address: c.address || '',
    customerType: c.customerType || '個人',
    loanRequired: c.loanRequired || false,
    brokerageType: c.brokerageType || '専任媒介',
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className={styles.editPanel}>
      <div className={styles.editPanelTitle}>案件情報を編集</div>

      <div className={styles.editGrid}>
        <div className={styles.editField}>
          <label className={styles.editLabel}>顧客名</label>
          <input className={styles.editInput} value={form.customerName} onChange={e => set('customerName', e.target.value)} placeholder="田辺 一博" />
        </div>
        <div className={styles.editField}>
          <label className={styles.editLabel}>売主/買主</label>
          <select className={styles.editSelect} value={form.side} onChange={e => set('side', e.target.value)}>
            {CASE_SIDES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className={styles.editField}>
          <label className={styles.editLabel}>顧客区分</label>
          <select className={styles.editSelect} value={form.customerType} onChange={e => set('customerType', e.target.value)}>
            {CUSTOMER_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className={styles.editField}>
          <label className={styles.editLabel}>エリア</label>
          <input className={styles.editInput} value={form.location} onChange={e => set('location', e.target.value)} placeholder="渋谷区桜丘" />
        </div>
        <div className={styles.editField}>
          <label className={styles.editLabel}>物件種別</label>
          <select className={styles.editSelect} value={form.propertyType} onChange={e => set('propertyType', e.target.value)}>
            <option value="">（未定）</option>
            {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className={styles.editField}>
          <label className={styles.editLabel}>価格</label>
          <input className={styles.editInput} value={form.price} onChange={e => set('price', e.target.value)} placeholder="5,800万円" />
        </div>
        <div className={styles.editField}>
          <label className={styles.editLabel}>媒介区分</label>
          <select className={styles.editSelect} value={form.brokerageType} onChange={e => set('brokerageType', e.target.value)}>
            {BROKERAGE_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className={styles.editField}>
          <label className={styles.editLabel}>ローン利用</label>
          <select className={styles.editSelect} value={form.loanRequired ? 'あり' : 'なし'} onChange={e => set('loanRequired', e.target.value === 'あり')}>
            <option>なし</option>
            <option>あり</option>
          </select>
        </div>
      </div>

      <div className={styles.editField} style={{ marginTop: 8 }}>
        <label className={styles.editLabel}>所在地（詳細）</label>
        <input className={styles.editInput} value={form.address} onChange={e => set('address', e.target.value)} placeholder="東京都渋谷区桜丘1-2-3" />
      </div>

      <div className={styles.editActions}>
        <button className={styles.editCancelBtn} onClick={onCancel}>キャンセル</button>
        <button className={styles.editSaveBtn} onClick={() => onSave(form)}>保存</button>
      </div>
    </div>
  );
}

export default function CaseDashboardPane({ selectedCase, onStageStatusChange, onUpdateCase }) {
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [topHeight, setTopHeight] = useState(null);
  const [editing, setEditing] = useState(false);

  const containerRef = useRef(null);
  const dragging     = useRef(false);
  const startY       = useRef(0);
  const startTop     = useRef(0);

  useEffect(() => { setSelectedStageId(null); setEditing(false); }, [selectedCase?.id]);

  const onMouseMove = useCallback((e) => {
    if (!dragging.current || !containerRef.current) return;
    const headerH = containerRef.current.querySelector('[data-role="header"]')?.offsetHeight ?? 0;
    const availH  = containerRef.current.offsetHeight - headerH - 8;
    const dy   = e.clientY - startY.current;
    const next = Math.min(availH - MIN_PX, Math.max(MIN_PX, startTop.current + dy));
    setTopHeight(next);
  }, []);

  const onMouseUp = useCallback(() => {
    dragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const startDrag = (e) => {
    dragging.current = true;
    startY.current   = e.clientY;
    const topEl = containerRef.current?.querySelector('[data-role="top"]');
    startTop.current = topEl ? topEl.offsetHeight : 300;
    document.body.style.cursor    = 'row-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };

  if (!selectedCase) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📋</div>
        <div className={styles.emptyTitle}>案件を選択してください</div>
        <div className={styles.emptyDesc}>左の一覧から案件を選ぶか、新規案件を作成してください</div>
      </div>
    );
  }

  const selectedStage   = selectedCase.stages.find(s => s.id === selectedStageId) || null;
  const completedStages = selectedCase.stages.filter(s => s.status === 'done').length;
  const progress        = Math.round((completedStages / selectedCase.stages.length) * 100);
  const statusStyle = STATUS_COLOR[selectedCase.status] || STATUS_COLOR['進行中'];
  const sideStyle   = SIDE_COLOR[selectedCase.side]     || SIDE_COLOR['売主側'];

  const topStyle = topHeight !== null ? { height: topHeight } : { flex: '0 0 45%' };

  const handleSave = (updates) => {
    onUpdateCase && onUpdateCase(selectedCase.id, updates);
    setEditing(false);
  };

  return (
    <div className={styles.pane} ref={containerRef}>

      {/* ── 案件ヘッダー（固定） ── */}
      <div className={styles.caseHeader} data-role="header">
        <div className={styles.caseHeaderTop}>
          <div className={styles.caseTitle}>{selectedCase.name}</div>
          <div className={styles.badges}>
            <span className={styles.badge} style={{ background: sideStyle.bg, color: sideStyle.text }}>
              {selectedCase.side}
            </span>
            <span className={styles.badge} style={{ background: statusStyle.bg, color: statusStyle.text }}>
              {selectedCase.status}
            </span>
            <button
              className={`${styles.editBtn} ${editing ? styles.editBtnActive : ''}`}
              onClick={() => setEditing(v => !v)}
              title="案件情報を編集"
            >
              ✏️ 編集
            </button>
          </div>
        </div>

        {/* 編集パネル */}
        {editing && (
          <CaseInfoEdit
            c={selectedCase}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        )}

        {/* 案件メタ情報（編集中は非表示） */}
        {!editing && (
          <div className={styles.caseMeta}>
            {selectedCase.customerName && <span className={styles.metaItem}>👤 {selectedCase.customerName}様</span>}
            {selectedCase.address && <span className={styles.metaItem}>📍 {selectedCase.address}</span>}
            {selectedCase.propertyType && <span className={styles.metaItem}>🏠 {selectedCase.propertyType}</span>}
            {selectedCase.price && <span className={styles.metaItem}>💰 {selectedCase.price}</span>}
            {selectedCase.customerType && <span className={styles.metaItem}>🏢 {selectedCase.customerType}</span>}
            {selectedCase.brokerageType && <span className={styles.metaItem}>📄 {selectedCase.brokerageType}</span>}
            {selectedCase.loanRequired && <span className={styles.metaItem}>🏦 ローンあり</span>}
            {!selectedCase.propertyType && !selectedCase.price && !selectedCase.address && (
              <span className={styles.metaEmpty}>
                物件情報未入力 —
                <button className={styles.metaEmptyBtn} onClick={() => setEditing(true)}>
                  今すぐ入力する
                </button>
              </span>
            )}
          </div>
        )}

        <div className={styles.progressBar}>
          <div className={styles.progressInner} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.progressLabel}>
          {completedStages}/{selectedCase.stages.length} 工程完了（{progress}%）
        </div>
      </div>

      {/* ── 上ペイン: 工程一覧 ── */}
      <div className={styles.topSection} style={topStyle} data-role="top">
        <div className={styles.paneLabel}>
          工程一覧
          <span className={styles.paneLabelHint}>クリックで詳細表示</span>
        </div>
        <div className={styles.scrollArea}>
          <StageList
            stages={selectedCase.stages}
            selectedStageId={selectedStageId}
            onSelectStage={setSelectedStageId}
            onStatusChange={(stageId, status) => onStageStatusChange(selectedCase.id, stageId, status)}
          />
        </div>
      </div>

      {/* ── 水平ドラッグハンドル ── */}
      <div className={styles.hDivider} onMouseDown={startDrag} title="ドラッグで高さ調整">
        <div className={styles.hDividerLine} />
      </div>

      {/* ── 下ペイン: 工程詳細 ── */}
      <div className={styles.bottomSection} data-role="bottom">
        <div className={styles.paneLabel}>
          工程詳細
          {selectedStage && (
            <span className={styles.selectedStageName}>{selectedStage.name}</span>
          )}
        </div>
        <div className={styles.scrollArea}>
          {selectedStage ? (
            <StageDetailInline
              stage={selectedStage}
              caseSide={selectedCase.side}
              onStatusChange={(status) => onStageStatusChange(selectedCase.id, selectedStage.id, status)}
            />
          ) : (
            <div className={styles.detailEmpty}>
              <span className={styles.detailEmptyIcon}>👆</span>
              <span>上の工程一覧から工程を選択してください</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
