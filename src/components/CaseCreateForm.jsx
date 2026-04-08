import { useState } from 'react';
import { PROPERTY_TYPES, BROKERAGE_TYPES, CUSTOMER_TYPES, CASE_SIDES, generateCaseName } from '../data/dummyData';
import styles from './CaseCreateForm.module.css';

const INITIAL = {
  customerName: '',
  side: '売主側',
  location: '',
  customerType: '個人',
  propertyType: '区分マンション',
  price: '',
  address: '',
  loanRequired: false,
  brokerageType: '専任媒介',
  hasMortgage: false,
  planRenovation: false,
  renovationLoan: false,
  isOwnerChange: false,
};

const INVESTMENT_TYPES = ['一棟マンション', '一棟アパート'];

export default function CaseCreateForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState(INITIAL);
  const [showDetails, setShowDetails] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const previewName = generateCaseName(form.customerName, form.location, form.propertyType, form.side);

  const validate = () => {
    const errs = {};
    if (!form.customerName.trim()) errs.customerName = '顧客名は必須です';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit(form);
  };

  const isInvestment = INVESTMENT_TYPES.includes(form.propertyType);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>業務プロセスを生成</span>
          <button className={styles.closeBtn} onClick={onCancel}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>

          {/* ─── 必須：顧客情報 ─── */}
          <div className={styles.sectionLabel}>案件・顧客情報 <span className={styles.sectionNote}>（入力情報から業務プロセスを自動生成します）</span></div>

          <div className={styles.row}>
            <div className={styles.field} style={{ flex: 2 }}>
              <label className={styles.label}>顧客名 <span className={styles.req}>*</span></label>
              <input
                className={`${styles.input} ${errors.customerName ? styles.inputError : ''}`}
                value={form.customerName}
                onChange={e => set('customerName', e.target.value)}
                placeholder="例: 田辺 一博"
              />
              {errors.customerName && <span className={styles.errorMsg}>{errors.customerName}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>売主/買主</label>
              <select className={styles.select} value={form.side} onChange={e => set('side', e.target.value)}>
                {CASE_SIDES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>顧客区分</label>
              <select className={styles.select} value={form.customerType} onChange={e => set('customerType', e.target.value)}>
                {CUSTOMER_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* 案件名プレビュー */}
          <div className={styles.namePreview}>
            <span className={styles.namePreviewLabel}>案件名プレビュー</span>
            <span className={styles.namePreviewValue}>{previewName || '（顧客名を入力してください）'}</span>
          </div>

          {/* ─── オプション：物件情報 ─── */}
          <button
            type="button"
            className={styles.toggleDetails}
            onClick={() => setShowDetails(v => !v)}
          >
            {showDetails ? '▲ 物件情報を閉じる' : '▼ 物件情報を入力する（任意・後から編集可）'}
          </button>

          {showDetails && (
            <div className={styles.detailsSection}>
              <div className={styles.sectionLabel}>物件情報 <span className={styles.sectionNote}>（初回面談後に確定でも可）</span></div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>エリア</label>
                  <input
                    className={styles.input}
                    value={form.location}
                    onChange={e => set('location', e.target.value)}
                    placeholder="例: 渋谷区桜丘"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>物件種別</label>
                  <select className={styles.select} value={form.propertyType} onChange={e => set('propertyType', e.target.value)}>
                    {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>価格</label>
                  <input
                    className={styles.input}
                    value={form.price}
                    onChange={e => set('price', e.target.value)}
                    placeholder="例: 5,800万円"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>媒介区分</label>
                  <select className={styles.select} value={form.brokerageType} onChange={e => set('brokerageType', e.target.value)}>
                    {BROKERAGE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>所在地（詳細）</label>
                <input
                  className={styles.input}
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                  placeholder="例: 東京都渋谷区桜丘1-2-3"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>ローン利用</label>
                <select
                  className={styles.select}
                  value={form.loanRequired ? 'あり' : 'なし'}
                  onChange={e => set('loanRequired', e.target.value === 'あり')}
                >
                  <option>なし</option>
                  <option>あり</option>
                </select>
              </div>

              {/* ─── 物件固有の条件 ─── */}
              <div className={styles.conditionsSection}>
                <div className={styles.sectionLabel}>物件固有の条件 <span className={styles.sectionNote}>（必要な書類の精度が上がります）</span></div>

                <div className={styles.conditionsGrid}>
                  {/* 抵当権の有無（売主側） */}
                  {form.side === '売主側' && (
                    <label className={styles.conditionItem}>
                      <div className={styles.conditionLabel}>
                        <span className={styles.conditionIcon}>🏦</span>
                        <div>
                          <div className={styles.conditionName}>抵当権の有無</div>
                          <div className={styles.conditionNote}>売主の物件に抵当権（住宅ローン等）がある場合</div>
                        </div>
                      </div>
                      <div className={styles.conditionToggle}>
                        <button
                          type="button"
                          className={`${styles.toggleBtn} ${!form.hasMortgage ? styles.toggleBtnActive : ''}`}
                          onClick={() => set('hasMortgage', false)}
                        >なし</button>
                        <button
                          type="button"
                          className={`${styles.toggleBtn} ${form.hasMortgage ? styles.toggleBtnActiveOn : ''}`}
                          onClick={() => set('hasMortgage', true)}
                        >あり</button>
                      </div>
                    </label>
                  )}

                  {/* リノベーション計画（買主側） */}
                  {form.side === '買主側' && (
                    <label className={styles.conditionItem}>
                      <div className={styles.conditionLabel}>
                        <span className={styles.conditionIcon}>🔨</span>
                        <div>
                          <div className={styles.conditionName}>購入後にリノベーションを行うか</div>
                          <div className={styles.conditionNote}>内見時の管理規約確認・工事範囲の検討に影響します</div>
                        </div>
                      </div>
                      <div className={styles.conditionToggle}>
                        <button
                          type="button"
                          className={`${styles.toggleBtn} ${!form.planRenovation ? styles.toggleBtnActive : ''}`}
                          onClick={() => { set('planRenovation', false); set('renovationLoan', false); }}
                        >なし</button>
                        <button
                          type="button"
                          className={`${styles.toggleBtn} ${form.planRenovation ? styles.toggleBtnActiveOn : ''}`}
                          onClick={() => set('planRenovation', true)}
                        >あり</button>
                      </div>
                    </label>
                  )}

                  {/* リノベローン（planRenovation=true のとき表示） */}
                  {form.side === '買主側' && form.planRenovation && (
                    <label className={styles.conditionItem}>
                      <div className={styles.conditionLabel}>
                        <span className={styles.conditionIcon}>💳</span>
                        <div>
                          <div className={styles.conditionName}>リノベ費用をローンに含めるか</div>
                          <div className={styles.conditionNote}>「あり」の場合、リノベ一体型ローンの手続きが追加されます</div>
                        </div>
                      </div>
                      <div className={styles.conditionToggle}>
                        <button
                          type="button"
                          className={`${styles.toggleBtn} ${!form.renovationLoan ? styles.toggleBtnActive : ''}`}
                          onClick={() => set('renovationLoan', false)}
                        >なし</button>
                        <button
                          type="button"
                          className={`${styles.toggleBtn} ${form.renovationLoan ? styles.toggleBtnActiveOn : ''}`}
                          onClick={() => set('renovationLoan', true)}
                        >あり</button>
                      </div>
                    </label>
                  )}

                  {/* オーナーチェンジ（売主側のみ） */}
                  {form.side === '売主側' && (
                    <label className={`${styles.conditionItem} ${!isInvestment ? styles.conditionItemDim : ''}`}>
                      <div className={styles.conditionLabel}>
                        <span className={styles.conditionIcon}>🏢</span>
                        <div>
                          <div className={styles.conditionName}>オーナーチェンジ</div>
                          <div className={styles.conditionNote}>現在入居者がいる状態での売買（賃貸借契約書が必要）</div>
                        </div>
                      </div>
                      <div className={styles.conditionToggle}>
                        <button
                          type="button"
                          className={`${styles.toggleBtn} ${!form.isOwnerChange ? styles.toggleBtnActive : ''}`}
                          onClick={() => set('isOwnerChange', false)}
                        >なし</button>
                        <button
                          type="button"
                          className={`${styles.toggleBtn} ${form.isOwnerChange ? styles.toggleBtnActiveOn : ''}`}
                          onClick={() => set('isOwnerChange', true)}
                        >あり</button>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onCancel}>キャンセル</button>
            <button type="submit" className={styles.submitBtn}>業務プロセスを生成</button>
          </div>
        </form>
      </div>
    </div>
  );
}
