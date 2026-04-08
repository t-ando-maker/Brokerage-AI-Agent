import { useState, useRef, useEffect } from 'react';
import EscalationCard from './EscalationCard';
import { ESCALATION_TRIGGERS } from '../data/dummyData';
import styles from './AIChatPane.module.css';

const SAMPLE_QUESTIONS = [
  '専任媒介と専属専任媒介の違いは？',
  '法人買主に必要な書類は？',
  '住宅ローン事前審査と本審査の違いは？',
  '手付解除の条件を教えて',
  '農地を購入する場合の注意点は？',
];

const CONFIDENCE_CONFIG = {
  '高': { color: '#10b981', bg: '#d1fae5' },
  '中': { color: '#f59e0b', bg: '#fef3c7' },
  '低': { color: '#ef4444', bg: '#fee2e2' },
};

const HQ_REPLIES = [
  'ご確認ありがとうございます。個別案件の詳細については、管轄の法務担当者にも確認した上で、正式な見解をメールにてご連絡いたします。一般的な解釈としては、当社の標準手順書を参照してください。',
  'お問い合わせいただきありがとうございます。本件は事例によって対応が異なりますが、基本的には監督官庁への事前確認を推奨しています。追加の書類が必要な場合は担当部署よりご連絡します。',
  '本社コンプライアンス部より回答いたします。ご指摘の点については当社規定集の第3章をご参照ください。不明点があれば本社直通ダイヤルまでご連絡ください。',
];

function buildSystemPrompt(selectedCase) {
  let caseSection = '';
  if (selectedCase) {
    const stage = selectedCase.stages?.find(s => s.id === selectedCase.stages[selectedCase.currentStageIndex]?.id)
      || selectedCase.stages?.[selectedCase.currentStageIndex];
    caseSection = `
## 現在の案件情報
- 案件名: ${selectedCase.name}
- 現在工程: ${stage?.name || '不明'}
- 売主/買主区分: ${selectedCase.side}
- 物件種別: ${selectedCase.propertyType || '未設定'}
`;
  }

  return `あなたは日本の不動産売買仲介業務を支援するAIアシスタントです。担当者（宅建業者）からの実務的な質問に、宅建業法・民法・不動産業界慣行に基づいて正確に回答してください。
${caseSection}
## 回答方針
- 法的根拠（条文・省令・判例等）を可能な限り明示する
- 回答の末尾に必ず【信頼度:高】【信頼度:中】【信頼度:低】のいずれかを付記する
- 回答は簡潔かつ実務に直結した内容にする

## 本社確認推奨の判断基準
以下に該当する場合は回答末尾に必ず【本社確認推奨】を付記する：
- 農地法・市街化調整区域・土壌汚染・埋蔵文化財・相続・成年後見・共有持分・借地権など高度な専門判断が必要な場合
- 個別案件の具体的な事実関係に依存する法的判断
- 回答に確信が持てない・情報が不十分な場合

回答は日本語で、**太字**や箇条書きを使って読みやすく整形してください。`;
}

async function callClaude(question, messages, selectedCase) {
  // 直近の会話履歴（最大8ターン）をコンテキストとして渡す
  const history = messages
    .filter(m => m.type !== 'intro' && (m.role === 'user' || m.role === 'assistant'))
    .slice(-8)
    .map(m => ({ role: m.role, content: m.content }));

  history.push({ role: 'user', content: question });

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: buildSystemPrompt(selectedCase),
      messages: history,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'APIエラーが発生しました');
  }

  return data.text;
}

function parseResponse(text) {
  const needsEscalation = text.includes('【本社確認推奨】');
  let confidence = '中';
  if (text.includes('【信頼度:高】')) confidence = '高';
  else if (text.includes('【信頼度:低】')) confidence = '低';

  // バッジテキストを除去して表示用テキストを作成
  const displayText = text
    .replace(/【信頼度:[高中低]】/g, '')
    .replace(/【本社確認推奨】/g, '')
    .trim();

  return { displayText, confidence, needsEscalation };
}

// ─── エスカレーション履歴アイテム（チャットログ表示付き） ───
function EscalationHistoryItem({ item, onHqReply }) {
  const [logOpen, setLogOpen] = useState(false);

  return (
    <div className={`${styles.escalationItem} ${item.status === 'answered' ? styles.escalationAnswered : ''}`}>
      <div className={styles.escalationItemHeader}>
        <span className={styles.escalationItemQ}>{item.question}</span>
        <span className={`${styles.escalationStatus} ${item.status === 'answered' ? styles.escalationStatusAnswered : styles.escalationStatusPending}`}>
          {item.status === 'answered' ? '✅ 回答済み' : '⏳ 待機中'}
        </span>
      </div>
      <div className={styles.escalationItemMeta}>{item.sentAt} 送信</div>

      {item.chatLog?.length > 0 && (
        <div className={styles.chatLogSection}>
          <button className={styles.chatLogToggle} onClick={() => setLogOpen(v => !v)}>
            📋 チャット履歴ログ（{item.chatLog.length}件）{logOpen ? ' ▲' : ' ▼'}
          </button>
          {logOpen && (
            <div className={styles.chatLog}>
              {item.chatLog.map((m, i) => (
                <div key={i} className={`${styles.chatLogRow} ${m.role === 'user' ? styles.chatLogUser : styles.chatLogAI}`}>
                  <span className={styles.chatLogRole}>{m.role === 'user' ? '担当者' : 'AI'}</span>
                  <span className={styles.chatLogText}>{m.content}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {item.hqReply && (
        <div className={styles.hqReplyBox}>
          <div className={styles.hqReplyLabel}>本社回答</div>
          <div className={styles.hqReplyText}>{item.hqReply}</div>
        </div>
      )}
      {item.status === 'pending' && (
        <button className={styles.simulateReplyBtn} onClick={() => onHqReply(item.id)}>
          本社回答をシミュレート
        </button>
      )}
    </div>
  );
}

// ─── エスカレーション履歴パネル ───
function EscalationHistoryPanel({ history, onHqReply }) {
  const [open, setOpen] = useState(false);

  if (history.length === 0) return null;

  const pending = history.filter(h => h.status === 'pending').length;

  return (
    <div className={styles.escalationHistory}>
      <button className={styles.escalationHistoryToggle} onClick={() => setOpen(v => !v)}>
        <span className={styles.escalationHistoryIcon}>🏢</span>
        <span>本社エスカレーション</span>
        {pending > 0 && <span className={styles.pendingBadge}>{pending}件 未回答</span>}
        <span className={styles.escalationHistoryArrow}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className={styles.escalationList}>
          {history.map(item => (
            <EscalationHistoryItem key={item.id} item={item} onHqReply={onHqReply} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AIChatPane({ selectedCase, fullMode = false }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: '不動産売買仲介に関するご質問にお答えします。案件情報・法令・業界慣行をもとに自然言語でご質問ください。',
      type: 'intro',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [escalation, setEscalation] = useState(null);
  const [escalationHistory, setEscalationHistory] = useState([]);
  const [ratings, setRatings] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getCaseContext = () => selectedCase ? {
    name: selectedCase.name,
    stage: selectedCase.stages?.[selectedCase.currentStageIndex]?.name,
    side: selectedCase.side,
  } : null;

  const sendMessage = async (text) => {
    const question = text || input.trim();
    if (!question) return;
    setInput('');
    setEscalation(null);

    const userMsg = { id: Date.now(), role: 'user', content: question };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setLoading(true);

    try {
      const rawText = await callClaude(question, messages, selectedCase);
      const { displayText, confidence, needsEscalation } = parseResponse(rawText);
      const msgId = Date.now() + 1;

      setMessages(prev => [...prev, {
        id: msgId,
        role: 'assistant',
        content: displayText,
        type: 'answer',
        confidence,
        needsEscalation,
      }]);

      if (needsEscalation) {
        setEscalation({
          question,
          aiResponse: displayText,
          escalateReason: 'ai_flagged',
          caseContext: getCaseContext(),
        });
      }
    } catch (err) {
      const errMsg = err.message || 'エラーが発生しました';
      const msgId = Date.now() + 1;
      setMessages(prev => [...prev, {
        id: msgId,
        role: 'assistant',
        content: `⚠️ ${errMsg}`,
        type: 'error',
      }]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleRating = (msgId, rating, msgContent) => {
    setRatings(prev => ({ ...prev, [msgId]: rating }));
    if (rating === 'bad') {
      setEscalation(prev => prev || {
        question: messages.find(m => m.id < msgId && m.role === 'user')?.content || '（質問内容不明）',
        aiResponse: msgContent,
        escalateReason: 'bad_rating',
        caseContext: getCaseContext(),
      });
    }
  };

  const handleEscalate = (question, chatLog = []) => {
    const newItem = {
      id: `esc-${Date.now()}`,
      question,
      chatLog: chatLog.filter(m => m.type !== 'intro'),
      status: 'pending',
      hqReply: null,
      sentAt: new Date().toLocaleString('ja-JP'),
    };
    setEscalationHistory(prev => [newItem, ...prev]);
    setEscalation(null);
  };

  const handleHqReply = (escalationId) => {
    const reply = HQ_REPLIES[Math.floor(Math.random() * HQ_REPLIES.length)];
    setEscalationHistory(prev => prev.map(item =>
      item.id === escalationId
        ? { ...item, status: 'answered', hqReply: reply }
        : item
    ));
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'assistant',
      content: `【本社回答】\n${reply}`,
      type: 'hq_reply',
    }]);
  };

  return (
    <div className={`${styles.pane} ${fullMode ? styles.paneFullMode : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <span className={styles.headerIcon}>🤖</span>
          <span>{fullMode ? '質問対応' : 'AI アシスタント'}</span>
        </div>
        {selectedCase && (
          <div className={styles.caseTag}>
            {selectedCase.name.length > 12 ? selectedCase.name.slice(0, 12) + '…' : selectedCase.name}
          </div>
        )}
      </div>

      <EscalationHistoryPanel history={escalationHistory} onHqReply={handleHqReply} />

      <div className={styles.samples}>
        <div className={styles.samplesLabel}>よくある質問:</div>
        <div className={styles.sampleBtns}>
          {SAMPLE_QUESTIONS.map((q, i) => (
            <button key={i} className={styles.sampleBtn} onClick={() => sendMessage(q)}>
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.messages}>
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            rating={ratings[msg.id]}
            onRate={(rating) => handleRating(msg.id, rating, msg.content)}
            onEscalate={() => setEscalation({
              question: messages.find(m => m.id < msg.id && m.role === 'user')?.content || '',
              aiResponse: msg.content,
              escalateReason: 'user_request',
              caseContext: getCaseContext(),
            })}
          />
        ))}
        {loading && (
          <div className={styles.loading}>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
        )}
        {escalation && !loading && (
          <EscalationCard
            question={escalation.question}
            aiResponse={escalation.aiResponse}
            escalateReason={escalation.escalateReason}
            caseContext={escalation.caseContext}
            chatLog={messages}
            onDismiss={() => setEscalation(null)}
            onEscalate={handleEscalate}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        <textarea
          className={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="質問を入力してください（Enter で送信）"
          rows={2}
          disabled={loading}
        />
        <button
          className={styles.sendBtn}
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
        >
          送信
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ msg, rating, onRate, onEscalate }) {
  const isUser = msg.role === 'user';
  const confCfg = msg.confidence ? CONFIDENCE_CONFIG[msg.confidence] : null;

  if (isUser) {
    return (
      <div className={styles.userBubble}>
        <div className={styles.userText}>{msg.content}</div>
      </div>
    );
  }

  const isRatable = msg.type === 'answer';
  const isHqReply = msg.type === 'hq_reply';
  const isError   = msg.type === 'error';

  return (
    <div className={`${styles.assistantBubble}
      ${isError ? styles.warningBubble : ''}
      ${isHqReply ? styles.hqBubble : ''}
    `}>
      <div className={styles.bubbleHeader}>
        <span className={styles.bubbleRole}>{isHqReply ? '本社' : 'AI'}</span>
        {confCfg && (
          <span className={styles.confidenceBadge} style={{ background: confCfg.bg, color: confCfg.color }}>
            信頼度: {msg.confidence}
          </span>
        )}
        {msg.needsEscalation && (
          <span className={styles.escalateBadge}>⚠️ 本社確認推奨</span>
        )}
      </div>
      <div className={styles.bubbleContent}>
        {msg.content.split('\n').map((line, i) => {
          if (line.startsWith('**') && line.endsWith('**')) {
            return <strong key={i} className={styles.bold}>{line.slice(2, -2)}</strong>;
          }
          if (line.startsWith('- ') || line.startsWith('・')) {
            return <div key={i} className={styles.listItem}>{line.startsWith('- ') ? '・' + line.slice(2) : line}</div>;
          }
          if (line.match(/^\d+\./)) {
            return <div key={i} className={styles.listItem}>{line}</div>;
          }
          if (line === '') return <div key={i} className={styles.spacer} />;
          return <div key={i}>{line}</div>;
        })}
      </div>

      {isRatable && (
        <div className={styles.ratingRow}>
          <span className={styles.ratingLabel}>この回答は役立ちましたか？</span>
          <button
            className={`${styles.ratingBtn} ${rating === 'good' ? styles.ratingBtnActive : ''}`}
            onClick={() => onRate('good')}
            title="役立った"
          >👍</button>
          <button
            className={`${styles.ratingBtn} ${rating === 'bad' ? styles.ratingBtnBad : ''}`}
            onClick={() => onRate('bad')}
            title="役立たなかった"
          >👎</button>
          {rating === 'good' && <span className={styles.ratingFeedback}>フィードバックありがとうございます</span>}
          {rating === 'bad' && <span className={styles.ratingFeedbackBad}>本社へのエスカレーションをご検討ください</span>}
          {isRatable && !rating && (
            <button className={styles.escalateFromMsgBtn} onClick={onEscalate}>
              🏢 本社へ確認
            </button>
          )}
        </div>
      )}
    </div>
  );
}
