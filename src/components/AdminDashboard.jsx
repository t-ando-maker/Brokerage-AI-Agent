import { useState, useMemo, useRef, useEffect } from 'react';
import { DUMMY_CASES, DUMMY_COMPLETED_CASES, SELLER_STAGES, BUYER_STAGES } from '../data/dummyData';
import styles from './AdminDashboard.module.css';

// ─────────────────────────────────────────────
// 定数・ユーティリティ
// ─────────────────────────────────────────────
function parsePrice(str) {
  if (!str) return 0;
  const s = str.replace(/,/g, '');
  const oku = s.match(/(\d+(?:\.\d+)?)億/);
  const man = s.match(/(\d+(?:\.\d+)?)万/);
  return (oku ? parseFloat(oku[1]) * 1e8 : 0) + (man ? parseFloat(man[1]) * 1e4 : 0);
}

function formatAmount(yen) {
  if (yen >= 1e8) {
    const v = yen / 1e8;
    return `${v % 1 === 0 ? v : v.toFixed(1)}億円`;
  }
  return `${(yen / 1e4).toLocaleString()}万円`;
}

function getFiscalYear(date) {
  const m = date.getMonth() + 1;
  return m >= 3 ? date.getFullYear() : date.getFullYear() - 1;
}

const TODAY = new Date();
const CURRENT_FY = getFiscalYear(TODAY);

function getPeriodRange(period, fy) {
  switch (period) {
    case 'q1':  return { start: new Date(fy, 2, 1),  end: new Date(fy, 4, 31) };
    case 'q2':  return { start: new Date(fy, 5, 1),  end: new Date(fy, 7, 31) };
    case 'q3':  return { start: new Date(fy, 8, 1),  end: new Date(fy, 10, 30) };
    case 'q4':  return { start: new Date(fy, 11, 1), end: new Date(fy + 1, 1, 28) };
    case 'h1':  return { start: new Date(fy, 2, 1),  end: new Date(fy, 7, 31) };
    case 'h2':  return { start: new Date(fy, 8, 1),  end: new Date(fy + 1, 1, 28) };
    default:    return { start: new Date(fy, 2, 1),  end: new Date(fy + 1, 1, 28) };
  }
}

function getPipelineStage(c) {
  if (c.status === '完了') return 'paid';
  if (c.currentStageIndex >= 8) return 'pre_payment';
  return 'pre_contract';
}

// 売却・購入それぞれの工程カラー（工程インデックス → 色）
const SELLER_COLORS = [
  '#dbeafe','#bfdbfe','#93c5fd','#60a5fa',
  '#3b82f6','#2563eb','#1d4ed8','#1e40af',
  '#1e3a8a','#312e81','#3730a3','#4338ca',
];
const BUYER_COLORS = [
  '#fef9c3','#fef08a','#fde047','#facc15',
  '#eab308','#ca8a04','#a16207','#854d0e',
  '#d97706','#b45309','#92400e','#78350f',
  '#7c3aed','#6d28d9',
];
const COMPLETED_COLOR = '#22c55e';

// 工程名 → カラー マップ
const SELLER_COLOR_MAP = Object.fromEntries(
  SELLER_STAGES.map((s, i) => [s.name, SELLER_COLORS[i] || '#94a3b8'])
);
SELLER_COLOR_MAP['完了'] = COMPLETED_COLOR;

const BUYER_COLOR_MAP = Object.fromEntries(
  BUYER_STAGES.map((s, i) => [s.name, BUYER_COLORS[i] || '#94a3b8'])
);
BUYER_COLOR_MAP['完了'] = COMPLETED_COLOR;

const PIPELINE_CONFIG = {
  pre_contract: { label: '契約前',  confidence: '50%', color: '#c7d2fe' },
  pre_payment:  { label: '入金前',  confidence: '80%', color: '#fde68a' },
  paid:         { label: '入金後',  confidence: '100%', color: '#bbf7d0' },
};

const PERIOD_GROUPS = [
  { label: 'クオーター', options: [
    { key: 'q1', label: 'Q1 (3-5月)' }, { key: 'q2', label: 'Q2 (6-8月)' },
    { key: 'q3', label: 'Q3 (9-11月)' }, { key: 'q4', label: 'Q4 (12-2月)' },
  ]},
  { label: '半期', options: [
    { key: 'h1', label: '上期 (3-8月)' }, { key: 'h2', label: '下期 (9-2月)' },
  ]},
  { label: '年', options: [{ key: 'year', label: `通期 FY${CURRENT_FY}` }] },
];

// ─────────────────────────────────────────────
// SVG ドーナツグラフ
// ─────────────────────────────────────────────
function DonutChart({ slices, size = 160, activeSlice, onSliceClick }) {
  const total = slices.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className={styles.noData}>データなし</div>;

  const cx = size / 2, cy = size / 2;
  let angle = -Math.PI / 2;
  const hasActive = activeSlice != null;

  return (
    <svg width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      {slices.map((sl, i) => {
        if (sl.value === 0) return null;
        const isActive = sl.name === activeSlice;
        // アクティブなスライスは少し大きく
        const r  = isActive ? size * 0.44 : size * 0.40;
        const ir = size * 0.22;
        const opacity = hasActive && !isActive ? 0.35 : 1;

        const frac = sl.value / total;
        const start = angle;
        const end = angle + frac * 2 * Math.PI;
        angle = end;

        const pathProps = {
          fill: sl.color,
          opacity,
          cursor: onSliceClick ? 'pointer' : 'default',
          onClick: () => onSliceClick && onSliceClick(sl.name),
          style: { transition: 'opacity 0.15s' },
        };

        if (frac >= 0.9999) {
          return (
            <g key={i} {...pathProps}>
              <circle cx={cx} cy={cy} r={r} fill={sl.color} opacity={opacity}
                cursor={onSliceClick ? 'pointer' : 'default'}
                onClick={() => onSliceClick && onSliceClick(sl.name)} />
              <circle cx={cx} cy={cy} r={ir} fill="#fff" style={{ pointerEvents: 'none' }} />
            </g>
          );
        }
        const x1 = cx + r * Math.cos(start),  y1 = cy + r * Math.sin(start);
        const x2 = cx + r * Math.cos(end),    y2 = cy + r * Math.sin(end);
        const ix1 = cx + ir * Math.cos(end),  iy1 = cy + ir * Math.sin(end);
        const ix2 = cx + ir * Math.cos(start),iy2 = cy + ir * Math.sin(start);
        const large = frac > 0.5 ? 1 : 0;
        const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${ir} ${ir} 0 ${large} 0 ${ix2} ${iy2} Z`;
        return <path key={i} d={d} {...pathProps} />;
      })}
      {/* 中央の白円（再描画でドーナツ維持） */}
      <circle cx={cx} cy={cy} r={size * 0.22} fill="#fff" style={{ pointerEvents: 'none' }} />
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="16" fontWeight="800" fill="#1a1a2e" style={{ pointerEvents: 'none' }}>{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#8892a4" style={{ pointerEvents: 'none' }}>件</text>
    </svg>
  );
}

// ─────────────────────────────────────────────
// 円グラフ + 凡例 カード
// ─────────────────────────────────────────────
function StageDonutCard({ title, cases, colorMap, activeStage, onStageClick }) {
  const groups = useMemo(() => {
    const map = {};
    cases.forEach(c => {
      const name = c.status === '完了' ? '完了' : (c.stages?.[c.currentStageIndex]?.name || '不明');
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, color: colorMap[name] || '#94a3b8' }))
      .sort((a, b) => {
        if (a.name === '完了') return 1;
        if (b.name === '完了') return -1;
        return 0;
      });
  }, [cases, colorMap]);

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>
        {title}
        {activeStage && (
          <button className={styles.clearFilterBtn} onClick={() => onStageClick(activeStage)}>
            ✕ {activeStage}
          </button>
        )}
      </div>
      <div className={styles.donutRow}>
        <DonutChart slices={groups} size={160} activeSlice={activeStage} onSliceClick={onStageClick} />
        <div className={styles.stageLegend}>
          {groups.map(g => (
            <div
              key={g.name}
              className={`${styles.legendItem} ${styles.legendItemClickable} ${activeStage === g.name ? styles.legendItemActive : ''}`}
              onClick={() => onStageClick(g.name)}
              title={`「${g.name}」でフィルタ`}
            >
              <span className={styles.legendDot} style={{ background: g.color }} />
              <span className={styles.legendLabel}>{g.name}</span>
              <span className={styles.legendCount}>{g.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ソート付き列ヘッダー
// ─────────────────────────────────────────────
function SortTh({ col, label, sort, onSort, children }) {
  return (
    <th className={styles.sortTh}>
      <div className={styles.sortThInner}>
        {children || label}
        <span className={styles.sortPair}>
          <button
            className={`${styles.sortArrow} ${sort.col === col && sort.dir === 'asc' ? styles.sortArrowActive : ''}`}
            onClick={() => onSort(col, 'asc')}
            title="昇順"
          >▲</button>
          <button
            className={`${styles.sortArrow} ${sort.col === col && sort.dir === 'desc' ? styles.sortArrowActive : ''}`}
            onClick={() => onSort(col, 'desc')}
            title="降順"
          >▼</button>
        </span>
      </div>
    </th>
  );
}

// ─────────────────────────────────────────────
// 担当者フィルタ列ヘッダー（Excelライク）
// ─────────────────────────────────────────────
function AgentFilterTh({ allAgents, checkedAgents, onToggle, onToggleAll }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const allChecked = checkedAgents === null;
  const someChecked = !allChecked && checkedAgents.size > 0;

  return (
    <th className={styles.filterTh} ref={ref}>
      <div className={styles.filterThInner}>
        <span>担当者</span>
        <button
          className={`${styles.filterBtn} ${open ? styles.filterBtnActive : ''}`}
          onClick={() => setOpen(v => !v)}
          title="フィルタ"
        >
          {allChecked ? '▼' : <span className={styles.filterActive}>▼</span>}
        </button>
      </div>

      {open && (
        <div className={styles.filterDropdown}>
          <label className={styles.filterItem}>
            <input
              type="checkbox"
              checked={allChecked}
              ref={el => { if (el) el.indeterminate = someChecked; }}
              onChange={onToggleAll}
            />
            <span>（全員）</span>
          </label>
          <div className={styles.filterDivider} />
          {allAgents.map(agent => (
            <label key={agent} className={styles.filterItem}>
              <input
                type="checkbox"
                checked={allChecked || checkedAgents.has(agent)}
                onChange={() => onToggle(agent)}
              />
              <span>{agent}</span>
            </label>
          ))}
        </div>
      )}
    </th>
  );
}

// ─────────────────────────────────────────────
// メインコンポーネント
// ─────────────────────────────────────────────
export default function AdminDashboard({ onSelectCase }) {
  const [period, setPeriod] = useState('year');
  const [sort, setSort] = useState({ col: null, dir: 'asc' });
  const [checkedAgents, setCheckedAgents] = useState(null); // null = all
  const [stageFilter, setStageFilter] = useState(null); // { side, name } | null

  const ALL_CASES = useMemo(() => [...DUMMY_CASES, ...DUMMY_COMPLETED_CASES], []);

  const periodRange = useMemo(() => getPeriodRange(period, CURRENT_FY), [period]);

  const filteredByPeriod = useMemo(() => {
    return ALL_CASES.filter(c => {
      const d = new Date(c.closedAt || c.contractExpectedDate || c.createdAt);
      return d >= periodRange.start && d <= periodRange.end;
    });
  }, [ALL_CASES, periodRange]);

  // 売却 / 購入 に分割
  const sellerCases = useMemo(() => filteredByPeriod.filter(c => c.side === '売主側'), [filteredByPeriod]);
  const buyerCases  = useMemo(() => filteredByPeriod.filter(c => c.side === '買主側'), [filteredByPeriod]);

  // 担当者一覧
  const allAgents = useMemo(() => {
    const set = new Set(filteredByPeriod.map(c => c.assignee).filter(Boolean));
    return Array.from(set).sort();
  }, [filteredByPeriod]);

  // 担当者フィルタ操作
  const toggleAgent = (agent) => {
    setCheckedAgents(prev => {
      const base = prev === null ? new Set(allAgents) : new Set(prev);
      if (base.has(agent)) base.delete(agent);
      else base.add(agent);
      return base.size === allAgents.length ? null : base;
    });
  };
  const toggleAll = () => setCheckedAgents(prev => prev === null ? new Set() : null);

  // 担当者フィルタ適用
  const agentFiltered = useMemo(() => {
    if (checkedAgents === null) return filteredByPeriod;
    return filteredByPeriod.filter(c => checkedAgents.has(c.assignee));
  }, [filteredByPeriod, checkedAgents]);

  // 工程クリック → フィルタ切替
  const handleStageClick = (side, name) => {
    setStageFilter(prev => prev?.side === side && prev?.name === name ? null : { side, name });
  };

  // 担当者バークリック → 単一担当者フィルタ
  const handleAgentBarClick = (agentName) => {
    setCheckedAgents(prev =>
      prev !== null && prev.size === 1 && prev.has(agentName) ? null : new Set([agentName])
    );
  };

  // ソート
  const handleSort = (col, dir) => {
    setSort(prev => prev.col === col && prev.dir === dir ? { col: null, dir: 'asc' } : { col, dir });
  };

  // 工程フィルタ適用
  const stageFiltered = useMemo(() => {
    if (!stageFilter) return agentFiltered;
    return agentFiltered.filter(c => {
      if (c.side !== stageFilter.side) return false; // 反対側は非表示
      const name = c.status === '完了' ? '完了' : (c.stages?.[c.currentStageIndex]?.name || '不明');
      return name === stageFilter.name;
    });
  }, [agentFiltered, stageFilter]);

  const sortedCases = useMemo(() => {
    if (!sort.col) return stageFiltered;
    return [...stageFiltered].sort((a, b) => {
      let va, vb;
      if (sort.col === 'price') {
        va = parsePrice(a.price); vb = parsePrice(b.price);
      } else if (sort.col === 'contractStart') {
        va = new Date(a.contractStartDate || 0); vb = new Date(b.contractStartDate || 0);
      } else if (sort.col === 'contractExpected') {
        va = new Date(a.contractExpectedDate || a.closedAt || 0);
        vb = new Date(b.contractExpectedDate || b.closedAt || 0);
      } else return 0;
      return sort.dir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
  }, [stageFiltered, sort]);

  // 担当者別進行中件数
  const agentCounts = useMemo(() => {
    const map = {};
    filteredByPeriod.filter(c => c.status !== '完了').forEach(c => {
      if (!c.assignee) return;
      map[c.assignee] = (map[c.assignee] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [filteredByPeriod]);

  // パイプライン金額
  const pipeline = useMemo(() => {
    const map = { pre_contract: 0, pre_payment: 0, paid: 0 };
    filteredByPeriod.forEach(c => { map[getPipelineStage(c)] += parsePrice(c.price); });
    return map;
  }, [filteredByPeriod]);
  const pipelineTotal = pipeline.pre_contract + pipeline.pre_payment + pipeline.paid;

  // 工程名・工程カラー取得
  const getStageInfo = (c) => {
    const name = c.status === '完了' ? '完了' : (c.stages?.[c.currentStageIndex]?.name || '不明');
    const colorMap = c.side === '売主側' ? SELLER_COLOR_MAP : BUYER_COLOR_MAP;
    const color = colorMap[name] || '#94a3b8';
    return { name, color };
  };

  return (
    <div className={styles.dashboard}>
      {/* ─── ページヘッダー ─── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleRow}>
          <span className={styles.pageIcon}>📊</span>
          <h2 className={styles.pageTitle}>管理者ダッシュボード</h2>
          <span className={styles.pageSub}>FY{CURRENT_FY} 全物件・案件横断管理</span>
        </div>
        <div className={styles.periodBar}>
          {PERIOD_GROUPS.map(group => (
            <div key={group.label} className={styles.periodGroup}>
              <span className={styles.periodGroupLabel}>{group.label}</span>
              <div className={styles.periodBtns}>
                {group.options.map(opt => (
                  <button
                    key={opt.key}
                    className={`${styles.periodBtn} ${period === opt.key ? styles.periodBtnActive : ''}`}
                    onClick={() => setPeriod(opt.key)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── スクロールエリア ─── */}
      <div className={styles.scrollArea}>

        {/* ─── サマリー行 ─── */}
        <div className={styles.summaryRow}>

          {/* 売却案件 工程分布 */}
          <StageDonutCard
            title="売却案件 工程分布"
            cases={sellerCases}
            colorMap={SELLER_COLOR_MAP}
            activeStage={stageFilter?.side === '売主側' ? stageFilter.name : null}
            onStageClick={(name) => handleStageClick('売主側', name)}
          />

          {/* 購入案件 工程分布 */}
          <StageDonutCard
            title="購入案件 工程分布"
            cases={buyerCases}
            colorMap={BUYER_COLOR_MAP}
            activeStage={stageFilter?.side === '買主側' ? stageFilter.name : null}
            onStageClick={(name) => handleStageClick('買主側', name)}
          />

          {/* 担当者別件数 */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              担当者別 進行中件数
              <span className={styles.cardNote}>（多い順 ＝ 要支援）</span>
            </div>
            {agentCounts.length === 0 ? (
              <div className={styles.noData}>該当なし</div>
            ) : (
              <div className={styles.agentList}>
                {agentCounts.map((ag, i) => {
                  const isAgentActive = checkedAgents !== null && checkedAgents.size === 1 && checkedAgents.has(ag.name);
                  return (
                  <div
                    key={ag.name}
                    className={`${styles.agentRow} ${styles.agentRowClickable} ${isAgentActive ? styles.agentRowActive : ''}`}
                    onClick={() => handleAgentBarClick(ag.name)}
                    title={`${ag.name} でフィルタ`}
                  >
                    <span className={styles.agentRank}>#{i + 1}</span>
                    <span className={styles.agentName}>{ag.name}</span>
                    <div className={styles.agentBar}>
                      <div
                        className={styles.agentBarFill}
                        style={{
                          width: `${(ag.count / (agentCounts[0]?.count || 1)) * 100}%`,
                          background: i === 0 ? '#ef4444' : i === 1 ? '#f59e0b' : '#4f6ef7',
                        }}
                      />
                    </div>
                    <span className={styles.agentCount}>{ag.count}</span>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* パイプライン金額 */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>パイプライン総金額</div>
            <div className={styles.pipelineTotal}>
              合計 <strong>{formatAmount(pipelineTotal)}</strong>
            </div>
            <div className={styles.pipelineList}>
              {Object.entries(PIPELINE_CONFIG).map(([key, cfg]) => (
                <div key={key} className={styles.pipelineRow}>
                  <span className={styles.pipelineDot} style={{ background: cfg.color, border: '1px solid #ddd' }} />
                  <span className={styles.pipelineLabel}>
                    {cfg.label}
                    <span className={styles.pipelineConf}>確度{cfg.confidence}</span>
                  </span>
                  <span className={styles.pipelineAmount}>
                    {pipeline[key] > 0 ? formatAmount(pipeline[key]) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── 案件一覧 ─── */}
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <span className={styles.tableTitle}>
              案件一覧
              {checkedAgents !== null && checkedAgents.size > 0 && (
                <span className={styles.filterIndicator}>
                  {checkedAgents.size}名でフィルタ中
                </span>
              )}
              {checkedAgents !== null && checkedAgents.size === 0 && (
                <span className={styles.filterIndicator}>担当者未選択</span>
              )}
              {stageFilter && (
                <span
                  className={styles.filterIndicator}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setStageFilter(null)}
                  title="工程フィルタを解除"
                >
                  工程: {stageFilter.name} ✕
                </span>
              )}
            </span>
            <span className={styles.caseCount}>{sortedCases.length}件</span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thName}>案件名</th>
                  <AgentFilterTh
                    allAgents={allAgents}
                    checkedAgents={checkedAgents}
                    onToggle={toggleAgent}
                    onToggleAll={toggleAll}
                  />
                  <th>物件種別</th>
                  <SortTh col="price" label="価格" sort={sort} onSort={handleSort} />
                  <th>工程</th>
                  <SortTh col="contractStart" label="契約開始日" sort={sort} onSort={handleSort} />
                  <SortTh col="contractExpected" label="締結見込み日" sort={sort} onSort={handleSort} />
                </tr>
              </thead>
              <tbody>
                {sortedCases.length === 0 ? (
                  <tr>
                    <td colSpan="7" className={styles.emptyRow}>該当する案件がありません</td>
                  </tr>
                ) : (
                  sortedCases.map(c => {
                    const { name: stageName, color: stageColor } = getStageInfo(c);
                    return (
                      <tr
                        key={c.id}
                        className={styles.trClickable}
                        onClick={() => onSelectCase && onSelectCase(c)}
                        title={`${c.assignee} の案件を開く`}
                      >
                        <td className={styles.tdName}>
                          {c.name}
                          <span className={styles.tdArrow}>→</span>
                        </td>
                        <td>{c.assignee || '—'}</td>
                        <td>
                          <span className={styles.sideBadge} style={{
                            color: c.side === '売主側' ? '#8b5cf6' : '#0ea5e9',
                            background: c.side === '売主側' ? '#f3e8ff' : '#e0f2fe',
                          }}>
                            {c.side}
                          </span>
                          {' '}{c.propertyType}
                        </td>
                        <td className={styles.tdPrice}>{c.price}</td>
                        <td>
                          <span
                            className={styles.stageBadge}
                            style={{
                              background: stageColor + '28',
                              color: stageColor === '#22c55e' ? '#15803d' : '#1a1a2e',
                              borderColor: stageColor + '55',
                              borderLeft: `3px solid ${stageColor}`,
                            }}
                          >
                            {stageName}
                          </span>
                        </td>
                        <td>{c.contractStartDate || '—'}</td>
                        <td>{c.contractExpectedDate || c.closedAt || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
