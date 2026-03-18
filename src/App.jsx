import { useState, useRef, useCallback, useEffect } from 'react';
import CaseListPane from './components/CaseListPane';
import CaseDashboardPane from './components/CaseDashboardPane';
import AIChatPane from './components/AIChatPane';
import TaskBoard from './components/TaskBoard';
import AdminDashboard from './components/AdminDashboard';
import { DUMMY_CASES, DUMMY_COMPLETED_CASES, DUMMY_AGENTS, SELLER_STAGES, BUYER_STAGES, STAGE_STATUS, generateCaseName } from './data/dummyData';
import styles from './App.module.css';

const MIN_LEFT = 18;
const MAX_LEFT = 38;
const MIN_RIGHT = 22;
const MAX_RIGHT = 45;

export default function App() {
  const [view, setView] = useState('main'); // 'main' | 'tasks' | 'dashboard'
  const [currentAgent, setCurrentAgent] = useState(DUMMY_AGENTS[0].name);
  const [cases, setCases] = useState([...DUMMY_CASES, ...DUMMY_COMPLETED_CASES]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [leftWidth, setLeftWidth] = useState(24);   // %
  const [rightWidth, setRightWidth] = useState(30); // %

  const bodyRef = useRef(null);
  const dragRef = useRef(null);

  // 担当者でフィルタした案件（案件管理用）
  const agentCases = cases.filter(c => c.assignee === currentAgent);
  const selectedCase = agentCases.find(c => c.id === selectedCaseId) || null;

  // ─── ドラッグリサイズ ───
  const onMouseMove = useCallback((e) => {
    if (!dragRef.current || !bodyRef.current) return;
    const { type, startX, startLeft, startRight } = dragRef.current;
    const totalW = bodyRef.current.offsetWidth;
    const dx = ((e.clientX - startX) / totalW) * 100;
    if (type === 'left') {
      setLeftWidth(Math.min(MAX_LEFT, Math.max(MIN_LEFT, startLeft + dx)));
    } else {
      setRightWidth(Math.min(MAX_RIGHT, Math.max(MIN_RIGHT, startRight - dx)));
    }
  }, []);

  const onMouseUp = useCallback(() => {
    dragRef.current = null;
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

  const startDragLeft = (e) => {
    dragRef.current = { type: 'left', startX: e.clientX, startLeft: leftWidth, startRight: rightWidth };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };

  const startDragRight = (e) => {
    dragRef.current = { type: 'right', startX: e.clientX, startLeft: leftWidth, startRight: rightWidth };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };

  // ─── 案件作成（現在の担当者を自動アサイン） ───
  const handleCreateCase = (formData) => {
    const stageTemplates = formData.side === '売主側' ? SELLER_STAGES : BUYER_STAGES;
    const today = new Date().toISOString().slice(0, 10);
    const name = generateCaseName(formData.customerName, formData.location, formData.propertyType, formData.side);
    const newCase = {
      id: `case-${Date.now()}`,
      assignee: currentAgent,
      createdAt: today,
      contractStartDate: today,
      contractExpectedDate: '',
      customerName: formData.customerName,
      location: formData.location || '',
      name,
      side: formData.side,
      propertyType: formData.propertyType || '',
      price: formData.price || '',
      address: formData.address || '',
      customerType: formData.customerType,
      loanRequired: formData.loanRequired,
      brokerageType: formData.brokerageType,
      currentStageIndex: 0,
      status: '進行中',
      stages: stageTemplates.map((s, i) => ({
        ...s,
        status: i === 0 ? STAGE_STATUS.IN_PROGRESS : STAGE_STATUS.PENDING,
      })),
      documents: [],
      risks: [],
      nextActions: ['案件情報を確認し、初回アクションを開始してください'],
    };
    setCases(prev => [newCase, ...prev]);
    setSelectedCaseId(newCase.id);
  };

  const handleUpdateCase = (caseId, updates) => {
    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      const updated = { ...c, ...updates };
      // 案件名に関わるフィールドが更新されたら名前を再生成
      if ('customerName' in updates || 'location' in updates || 'propertyType' in updates || 'side' in updates) {
        updated.name = generateCaseName(updated.customerName, updated.location, updated.propertyType, updated.side);
      }
      return updated;
    }));
  };

  const handleStageStatusChange = (caseId, stageId, newStatus) => {
    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      const updatedStages = c.stages.map(s => s.id === stageId ? { ...s, status: newStatus } : s);
      const currentStageIndex = updatedStages.findIndex(s => s.status === STAGE_STATUS.IN_PROGRESS);
      return {
        ...c,
        stages: updatedStages,
        currentStageIndex: currentStageIndex >= 0 ? currentStageIndex : c.currentStageIndex,
      };
    }));
  };

  // 担当者切替時は選択案件をリセット
  const handleAgentChange = (name) => {
    setCurrentAgent(name);
    setSelectedCaseId(null);
  };

  // ダッシュボードから案件クリック → 案件管理画面に遷移
  const handleDashboardCaseSelect = (c) => {
    if (c.assignee) setCurrentAgent(c.assignee);
    setSelectedCaseId(c.id);
    setView('main');
  };

  const centerWidth = 100 - leftWidth - rightWidth;
  const isAgentView = view === 'main' || view === 'tasks';

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerBrand}>
          <span className={styles.headerIcon}>🏠</span>
          <span className={styles.headerTitle}>不動産売買仲介 AIエージェント</span>
          <span className={styles.headerBadge}>MVP</span>
        </div>

        <nav className={styles.headerNav}>
          <button
            className={`${styles.navBtn} ${view === 'main' ? styles.navBtnActive : ''}`}
            onClick={() => setView('main')}
          >
            案件管理
          </button>
          <button
            className={`${styles.navBtn} ${view === 'tasks' ? styles.navBtnActive : ''}`}
            onClick={() => setView('tasks')}
          >
            タスクボード
          </button>
          <button
            className={`${styles.navBtn} ${view === 'dashboard' ? styles.navBtnActive : ''}`}
            onClick={() => setView('dashboard')}
          >
            ダッシュボード
          </button>
        </nav>

        <div className={styles.headerRight}>
          {/* 担当者セレクタ（案件管理・タスクボード時のみ） */}
          {isAgentView && (
            <div className={styles.agentSwitcher}>
              <span className={styles.agentSwitcherLabel}>👤 担当者</span>
              <select
                className={styles.agentSelect}
                value={currentAgent}
                onChange={e => handleAgentChange(e.target.value)}
              >
                {DUMMY_AGENTS.map(a => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>
          )}
          {/* ダッシュボード時のラベル */}
          {!isAgentView && (
            <div className={styles.managerLabel}>🔒 管理者ビュー</div>
          )}
          <span className={styles.headerCaseCount}>
            {isAgentView
              ? `${agentCases.length}件`
              : `全${cases.length}件`}
          </span>
        </div>
      </header>

      {/* タスクボード（担当者フィルタ済み） */}
      {view === 'tasks' && (
        <div className={styles.fullPane}>
          <TaskBoard currentAgent={currentAgent} />
        </div>
      )}

      {/* 管理者ダッシュボード（全エージェント横断） */}
      {view === 'dashboard' && (
        <div className={styles.fullPane}>
          <AdminDashboard onSelectCase={handleDashboardCaseSelect} />
        </div>
      )}

      {/* 案件管理（担当者フィルタ済み） */}
      <div className={styles.body} ref={bodyRef} style={{ display: view === 'main' ? 'flex' : 'none' }}>
        <div className={styles.leftPane} style={{ width: `${leftWidth}%` }}>
          <CaseListPane
            cases={agentCases}
            selectedCaseId={selectedCaseId}
            onSelectCase={setSelectedCaseId}
            onCreateCase={handleCreateCase}
          />
        </div>

        <div className={styles.divider} onMouseDown={startDragLeft} title="ドラッグで幅調整">
          <div className={styles.dividerLine} />
        </div>

        <div className={styles.centerPane} style={{ width: `${centerWidth}%` }}>
          <CaseDashboardPane
            selectedCase={selectedCase}
            onStageStatusChange={handleStageStatusChange}
            onUpdateCase={handleUpdateCase}
          />
        </div>

        <div className={styles.divider} onMouseDown={startDragRight} title="ドラッグで幅調整">
          <div className={styles.dividerLine} />
        </div>

        <div className={styles.rightPane} style={{ width: `${rightWidth}%` }}>
          <AIChatPane selectedCase={selectedCase} />
        </div>
      </div>
    </div>
  );
}
