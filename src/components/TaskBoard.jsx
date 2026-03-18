import { useState, useRef } from 'react';
import { DUMMY_TASKS } from '../data/dummyData';
import styles from './TaskBoard.module.css';

const COLUMNS = [
  { key: 'upcoming',    label: '直近1カ月のタスク', accent: '#4f6ef7' },
  { key: 'in_progress', label: '取り組み中',         accent: '#f59e0b' },
  { key: 'done',        label: '完了',               accent: '#22c55e' },
];

const STATUS_OPTIONS = [
  { value: 'upcoming',    label: '直近1カ月' },
  { value: 'in_progress', label: '取り組み中' },
  { value: 'done',        label: '完了' },
];

const PRIORITY_CONFIG = {
  high:   { label: '高', color: '#ef4444' },
  medium: { label: '中', color: '#f59e0b' },
  low:    { label: '低', color: '#6b7280' },
};

export default function TaskBoard({ currentAgent }) {
  const [tasks, setTasks] = useState(DUMMY_TASKS);
  const [showDone, setShowDone] = useState(true);
  const [dragOver, setDragOver] = useState(null); // column key being hovered
  const draggingId = useRef(null);

  const changeStatus = (taskId, newStatus) =>
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

  const handleDragStart = (e, taskId) => {
    draggingId.current = taskId;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    draggingId.current = null;
    setDragOver(null);
  };

  const handleDragOver = (e, colKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(colKey);
  };

  const handleDrop = (e, colKey) => {
    e.preventDefault();
    if (draggingId.current) changeStatus(draggingId.current, colKey);
    draggingId.current = null;
    setDragOver(null);
  };

  return (
    <div className={styles.board}>
      {/* ヘッダー */}
      <div className={styles.boardHeader}>
        <div className={styles.boardTitleRow}>
          <span className={styles.boardIcon}>📋</span>
          <h2 className={styles.boardTitle}>タスクボード</h2>
          <span className={styles.boardSub}>物件・案件横断タスク管理</span>
        </div>
        <button
          className={`${styles.toggleBtn} ${!showDone ? styles.toggleBtnActive : ''}`}
          onClick={() => setShowDone(v => !v)}
        >
          {showDone ? '完了を非表示' : '完了を表示'}
        </button>
      </div>

      {/* カンバン列 */}
      <div className={styles.columns}>
        {COLUMNS.map(col => {
          const agentTasks = currentAgent ? tasks.filter(t => t.assignee === currentAgent) : tasks;
          const colTasks = agentTasks.filter(t => {
            if (col.key === 'done' && !showDone) return false;
            return t.status === col.key;
          });
          const isOver = dragOver === col.key;

          return (
            <div
              key={col.key}
              className={`${styles.column} ${isOver ? styles.columnOver : ''}`}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              {/* 列ヘッダー */}
              <div className={styles.colHeader} style={{ borderTopColor: col.accent }}>
                <span className={styles.colTitle}>{col.label}</span>
                <span className={styles.colBadge} style={{ background: col.accent }}>
                  {colTasks.length}
                </span>
              </div>

              {/* カード一覧 */}
              <div className={styles.colBody}>
                {colTasks.map(task => {
                  const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.low;
                  return (
                    <div
                      key={task.id}
                      className={styles.card}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                    >
                      {/* カードトップ */}
                      <div className={styles.cardTop}>
                        <span className={styles.caseTag}>{task.caseName}</span>
                        <span className={styles.priority} style={{ color: pc.color }}>
                          ● {pc.label}
                        </span>
                      </div>

                      {/* タイトル */}
                      <p className={styles.cardTitle}>{task.title}</p>

                      {/* メタ情報 */}
                      <div className={styles.cardMeta}>
                        <span className={styles.assignee}>👤 {task.assignee}</span>
                        <span className={styles.dueDate}>📅 {task.dueDate}</span>
                      </div>

                      {/* ステータス変更 */}
                      <select
                        className={styles.statusSelect}
                        value={task.status}
                        onChange={(e) => changeStatus(task.id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className={styles.emptyCol}>
                    {col.key === 'done' && !showDone ? '非表示中' : 'タスクなし'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
