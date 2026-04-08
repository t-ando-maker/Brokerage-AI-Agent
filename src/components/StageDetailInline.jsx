import { getStageTemplates } from '../data/dummyData';
import styles from './StageDetailInline.module.css';

const ACTION_BADGE = {
  '作成する':     { label: '作成', cls: 'badgeCreate' },
  '収集する':     { label: '取得', cls: 'badgeGet' },
  '依頼する':     { label: '依頼', cls: 'badgeRequest' },
  '確認する':     { label: '確認', cls: 'badgeCheck' },
  '提出する':     { label: '提出', cls: 'badgeSubmit' },
  'サンプルを開く': { label: '確認', cls: 'badgeCheck' },
};

export default function StageDetailInline({ stage, caseSide, caseConditions }) {
  const templates = getStageTemplates(stage.id, caseSide, caseConditions);
  const hasTemplates = templates.length > 0;

  return (
    <div className={styles.wrap}>

      {/* やること ＋ テンプレート（統合リスト） */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>📋 この工程でやること</div>

        {hasTemplates ? (
          <div className={styles.taskList}>
            {templates.map(t => (
              <div key={t.id} className={styles.taskRow}>
                <div className={styles.taskMain}>
                  <span className={styles.taskCheck}>□</span>
                  <div className={styles.taskBody}>
                    <div className={styles.taskName}>
                      {ACTION_BADGE[t.actionLabel] && (
                        <span className={`${styles.catBadge} ${styles[ACTION_BADGE[t.actionLabel].cls]}`}>
                          {ACTION_BADGE[t.actionLabel].label}
                        </span>
                      )}
                      {t.name}
                    </div>
                    {t.note && (
                      <div className={styles.taskNote}>
                        <span className={styles.noteIcon}>💡</span>{t.note}
                      </div>
                    )}
                  </div>
                  <button className={styles.templateBtn}>{t.actionLabel}</button>
                </div>
              </div>
            ))}
          </div>
        ) : stage.tasks?.length > 0 ? (
          <ul className={styles.plainTaskList}>
            {stage.tasks.map((t, i) => (
              <li key={i} className={styles.plainTaskItem}>
                <span className={styles.taskCheck}>□</span>
                {t}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>この工程のタスク情報はありません</p>
        )}
      </section>

      {/* 本社確認が必要な場合 */}
      {stage.escalationNeeded && (
        <section className={`${styles.section} ${styles.escalateSection}`}>
          <div className={styles.sectionTitle}>🏢 本社確認が必要な工程</div>
          <p className={styles.escalateText}>
            この工程には本社確認が必要な事項が含まれる可能性があります。
            右ペインのAIチャットから質問するか、本社へ問い合わせてください。
          </p>
        </section>
      )}
    </div>
  );
}
