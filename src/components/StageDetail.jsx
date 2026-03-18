import { SELLER_STAGE_TEMPLATES, BUYER_STAGE_TEMPLATES, STAGE_STATUS } from '../data/dummyData';
import styles from './StageDetail.module.css';

const CATEGORY_COLORS = {
  '受付': '#6366f1',
  '情報収集': '#0ea5e9',
  '物件調査': '#f59e0b',
  '査定': '#10b981',
  '媒介契約': '#8b5cf6',
  '販売開始': '#06b6d4',
  '申込': '#f97316',
  '重説準備': '#ef4444',
  '重説確認': '#ef4444',
  '売買契約': '#dc2626',
  '決済準備': '#7c3aed',
  '決済': '#059669',
  '決済後': '#374151',
  'ヒアリング': '#6366f1',
  '資金計画': '#0ea5e9',
  '物件紹介': '#10b981',
  '内見': '#f59e0b',
  '事前審査': '#8b5cf6',
  '購入申込': '#f97316',
  '条件交渉': '#f59e0b',
  '本審査': '#7c3aed',
  '金消契約': '#dc2626',
  '入居後': '#374151',
};

export default function StageDetail({ stage, caseSide, onClose, onStatusChange }) {
  const templateMap = caseSide === '買主側' ? BUYER_STAGE_TEMPLATES : SELLER_STAGE_TEMPLATES;
  const templates = templateMap[stage.id] || [];

  // カテゴリ別グループ化
  const grouped = templates.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.panelTitle}>{stage.name}</span>
            <select
              className={styles.statusSelect}
              value={stage.status}
              onChange={e => onStatusChange(e.target.value)}
            >
              <option value={STAGE_STATUS.PENDING}>未着手</option>
              <option value={STAGE_STATUS.IN_PROGRESS}>進行中</option>
              <option value={STAGE_STATUS.NEEDS_CHECK}>要確認</option>
              <option value={STAGE_STATUS.DONE}>完了</option>
            </select>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕ 閉じる</button>
        </div>

        <div className={styles.body}>
          <div className={styles.cols}>
            {/* 左カラム: タスク・書類・注意点・完了条件 */}
            <div className={styles.leftCol}>
              <section className={styles.section}>
                <div className={styles.sectionTitle}>📋 この工程でやること</div>
                <ul className={styles.taskList}>
                  {stage.tasks?.map((t, i) => (
                    <li key={i} className={styles.taskItem}>
                      <span className={styles.taskCheck}>□</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </section>

              {stage.requiredDocuments?.length > 0 && (
                <section className={styles.section}>
                  <div className={styles.sectionTitle}>📁 収集・確認が必要な書類</div>
                  <div className={styles.docGrid}>
                    {stage.requiredDocuments.map((d, i) => (
                      <div key={i} className={styles.docTag}>{d}</div>
                    ))}
                  </div>
                </section>
              )}

              {stage.notes && (
                <section className={`${styles.section} ${styles.notesSection}`}>
                  <div className={styles.sectionTitle}>⚠️ 注意点</div>
                  <p className={styles.notesText}>{stage.notes}</p>
                </section>
              )}

              {stage.completionCriteria && (
                <section className={`${styles.section} ${styles.completionSection}`}>
                  <div className={styles.sectionTitle}>✅ 完了条件</div>
                  <p className={styles.completionText}>{stage.completionCriteria}</p>
                </section>
              )}

              {stage.escalationNeeded && (
                <section className={`${styles.section} ${styles.escalateSection}`}>
                  <div className={styles.sectionTitle}>🏢 本社確認が必要な工程</div>
                  <p className={styles.escalateText}>
                    この工程には本社確認が必要な事項が含まれる可能性があります。
                    不明な点は右ペインのAIチャットから質問するか、本社へ問い合わせてください。
                  </p>
                  <button className={styles.escalateBtn}>本社に問い合わせを作成</button>
                </section>
              )}
            </div>

            {/* 右カラム: 工程別テンプレート */}
            <div className={styles.rightCol}>
              {templates.length === 0 ? (
                <section className={styles.section}>
                  <div className={styles.sectionTitle}>📝 書類テンプレート</div>
                  <p className={styles.emptyTemplates}>この工程のテンプレートはまだ登録されていません</p>
                </section>
              ) : (
                Object.entries(grouped).map(([category, items]) => (
                  <section key={category} className={styles.section}>
                    <div className={styles.sectionTitle}>
                      📝 テンプレート
                      <span
                        className={styles.categoryBadge}
                        style={{ background: (CATEGORY_COLORS[category] || '#6b7280') + '18', color: CATEGORY_COLORS[category] || '#6b7280' }}
                      >
                        {category}
                      </span>
                    </div>
                    <div className={styles.templateList}>
                      {items.map(t => (
                        <div key={t.id} className={styles.templateCard}>
                          <div className={styles.templateInfo}>
                            <div className={styles.templateName}>{t.name}</div>
                            <div className={styles.templateDesc}>{t.description}</div>
                            {t.note && (
                              <div className={styles.templateNote}>
                                <span className={styles.noteIcon}>💡</span>
                                {t.note}
                              </div>
                            )}
                          </div>
                          <button className={styles.templateBtn}>{t.actionLabel}</button>
                        </div>
                      ))}
                    </div>
                  </section>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
