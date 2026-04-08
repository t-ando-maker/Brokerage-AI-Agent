import { useState, useRef, useCallback, useEffect } from 'react';
import CaseListPane from './components/CaseListPane';
import CaseDashboardPane from './components/CaseDashboardPane';
import AIChatPane from './components/AIChatPane';
import { DUMMY_CASES, DUMMY_COMPLETED_CASES, DUMMY_AGENTS, SELLER_STAGES, BUYER_STAGES, STAGE_STATUS, generateCaseName, syncConditionStages } from './data/dummyData';
import styles from './App.module.css';

const MIN_LEFT = 18;
const MAX_LEFT = 38;
const MIN_RIGHT = 22;
const MAX_RIGHT = 45;

export default function App() {
  const [currentAgent, setCurrentAgent] = useState(DUMMY_AGENTS[0].name);
  const [cases, setCases] = useState([...DUMMY_CASES, ...DUMMY_COMPLETED_CASES]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [leftWidth, setLeftWidth] = useState(22);
  const [rightWidth, setRightWidth] = useState(32);

  const bodyRef = useRef(null);
  const dragRef = useRef(null);

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

  // ─── 業務プロセス生成 ───
  const handleCreateCase = (formData) => {
    const stageTemplates = formData.side === '売主側' ? SELLER_STAGES : BUYER_STAGES;
    const today = new Date().toISOString().slice(0, 10);
    const name = generateCaseName(formData.customerName, formData.location, formData.propertyType, formData.side);
    const newCase = {
      id: `case-${Date.now()}`,
      assignee: currentAgent,
      createdAt: today,
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
      hasMortgage: formData.hasMortgage || false,
      planRenovation: formData.planRenovation || false,
      renovationLoan: formData.renovationLoan || false,
      isOwnerChange: formData.isOwnerChange || false,
      currentStageIndex: 0,
      status: '進行中',
      stages: stageTemplates.map((s, i) => ({
        ...s,
        status: i === 0 ? STAGE_STATUS.IN_PROGRESS : STAGE_STATUS.PENDING,
      })),
      documents: [],
    };
    setCases(prev => [newCase, ...prev]);
    setSelectedCaseId(newCase.id);
  };

  const handleUpdateCase = (caseId, updates) => {
    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      const updated = { ...c, ...updates };
      if ('customerName' in updates || 'location' in updates || 'propertyType' in updates || 'side' in updates) {
        updated.name = generateCaseName(updated.customerName, updated.location, updated.propertyType, updated.side);
      }
      // 条件変更時に工程リストを再同期
      const conditionKeys = ['hasMortgage', 'planRenovation', 'isOwnerChange', 'side'];
      if (conditionKeys.some(k => k in updates)) {
        updated.stages = syncConditionStages(updated.stages, updated.side, {
          hasMortgage:    updated.hasMortgage,
          planRenovation: updated.planRenovation,
          isOwnerChange:  updated.isOwnerChange,
        });
      }
      return updated;
    }));
  };

  const handleDeleteCase = (caseId) => {
    setCases(prev => prev.filter(c => c.id !== caseId));
    setSelectedCaseId(null);
  };

  const handleReorderStages = (caseId, newStages) => {
    setCases(prev => prev.map(c =>
      c.id === caseId ? { ...c, stages: newStages } : c
    ));
  };

  const handleAgentChange = (name) => {
    setCurrentAgent(name);
    setSelectedCaseId(null);
  };

  const centerWidth = 100 - leftWidth - rightWidth;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerBrand}>
          <span className={styles.headerIcon}>🏠</span>
          <span className={styles.headerTitle}>不動産売買仲介 AIエージェント</span>
          <span className={styles.headerBadge}>MVP</span>
        </div>

        <div className={styles.headerRight}>
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
          <span className={styles.headerCaseCount}>{agentCases.length}件</span>
        </div>
      </header>

      <div className={styles.body} ref={bodyRef}>
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
            onUpdateCase={handleUpdateCase}
            onReorderStages={handleReorderStages}
            onDeleteCase={handleDeleteCase}
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
