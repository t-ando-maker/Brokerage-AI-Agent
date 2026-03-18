import styles from './StageList.module.css';
import { STAGE_STATUS } from '../data/dummyData';

const STATUS_CONFIG = {
  [STAGE_STATUS.DONE]: { label: '完了', color: '#10b981', bg: '#d1fae5', icon: '✓' },
  [STAGE_STATUS.IN_PROGRESS]: { label: '進行中', color: '#4f6ef7', bg: '#dbeafe', icon: '●' },
  [STAGE_STATUS.PENDING]: { label: '未着手', color: '#9ca3af', bg: '#f3f4f6', icon: '○' },
  [STAGE_STATUS.NEEDS_CHECK]: { label: '要確認', color: '#f59e0b', bg: '#fef3c7', icon: '!' },
};

export default function StageList({ stages, selectedStageId, onSelectStage, onStatusChange }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.list}>
        {stages.map((stage, idx) => {
          const cfg = STATUS_CONFIG[stage.status] || STATUS_CONFIG[STAGE_STATUS.PENDING];
          const isSelected = stage.id === selectedStageId;
          return (
            <div
              key={stage.id}
              className={`${styles.item} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSelectStage(isSelected ? null : stage.id)}
            >
              <div className={styles.indexCol}>
                <div
                  className={styles.statusIcon}
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  {cfg.icon}
                </div>
                {idx < stages.length - 1 && (
                  <div
                    className={styles.connector}
                    style={{ background: stage.status === STAGE_STATUS.DONE ? '#10b981' : '#e5e7ef' }}
                  />
                )}
              </div>
              <div className={styles.content}>
                <div className={styles.stageName}>{stage.name}</div>
                <div className={styles.stageMeta}>
                  <span
                    className={styles.stageBadge}
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                  {stage.escalationNeeded && (
                    <span className={styles.escalateBadge}>本社確認</span>
                  )}
                  {stage.requiredDocuments?.length > 0 && (
                    <span className={styles.docBadge}>{stage.requiredDocuments.length}書類</span>
                  )}
                </div>
              </div>
              <div className={styles.statusControl} onClick={e => e.stopPropagation()}>
                <select
                  className={styles.statusSelect}
                  value={stage.status}
                  onChange={e => onStatusChange(stage.id, e.target.value)}
                  title="ステータス変更"
                >
                  <option value={STAGE_STATUS.PENDING}>未着手</option>
                  <option value={STAGE_STATUS.IN_PROGRESS}>進行中</option>
                  <option value={STAGE_STATUS.NEEDS_CHECK}>要確認</option>
                  <option value={STAGE_STATUS.DONE}>完了</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
