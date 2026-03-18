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
};

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

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>新規案件作成</span>
          <button className={styles.closeBtn} onClick={onCancel}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>

          {/* ─── 必須：顧客情報 ─── */}
          <div className={styles.sectionLabel}>顧客情報 <span className={styles.sectionNote}>（初回面談前でも登録できます）</span></div>

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
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onCancel}>キャンセル</button>
            <button type="submit" className={styles.submitBtn}>案件を作成</button>
          </div>
        </form>
      </div>
    </div>
  );
}
