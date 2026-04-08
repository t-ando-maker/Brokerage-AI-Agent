import { useState, useRef } from 'react';
import styles from './StageList.module.css';

export default function StageList({ stages, selectedStageId, onSelectStage, onReorderStages }) {
  const [dragOverId, setDragOverId] = useState(null);
  const dragIdRef = useRef(null);

  const handleDragStart = (e, id) => {
    dragIdRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIdRef.current !== id) setDragOverId(id);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    const fromId = dragIdRef.current;
    if (!fromId || fromId === targetId) { setDragOverId(null); return; }

    const fromIdx = stages.findIndex(s => s.id === fromId);
    const toIdx   = stages.findIndex(s => s.id === targetId);
    const next = [...stages];
    const [removed] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, removed);
    onReorderStages(next);
    setDragOverId(null);
    dragIdRef.current = null;
  };

  const handleDragEnd = () => {
    setDragOverId(null);
    dragIdRef.current = null;
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.list}>
        {stages.map((stage, idx) => {
          const isSelected  = stage.id === selectedStageId;
          const isDragOver  = stage.id === dragOverId;

          return (
            <div
              key={stage.id}
              className={`${styles.item} ${isSelected ? styles.selected : ''} ${isDragOver ? styles.dragOver : ''}`}
              draggable
              onDragStart={e => handleDragStart(e, stage.id)}
              onDragOver={e => handleDragOver(e, stage.id)}
              onDrop={e => handleDrop(e, stage.id)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelectStage(isSelected ? null : stage.id)}
            >
              <div className={styles.dragHandle} title="ドラッグで並び替え">⋮⋮</div>

              <div className={styles.indexCol}>
                <div className={styles.indexNum}>{idx + 1}</div>
                {idx < stages.length - 1 && <div className={styles.connector} />}
              </div>

              <div className={styles.content}>
                <div className={styles.stageName}>{stage.name}</div>
                {stage.requiredDocuments?.length > 0 && (
                  <div className={styles.docBadge}>{stage.requiredDocuments.length}書類</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
