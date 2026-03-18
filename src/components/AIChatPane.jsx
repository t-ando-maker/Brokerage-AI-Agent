import { useState, useRef, useEffect } from 'react';
import EscalationCard from './EscalationCard';
import { QA_PATTERNS, KNOWLEDGE_BASE, ESCALATION_TRIGGERS } from '../data/dummyData';
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

function findResponse(question) {
  const q = question.toLowerCase();

  // エスカレーション判定
  const needsEscalation = ESCALATION_TRIGGERS.some(trigger =>
    question.includes(trigger)
  );

  if (needsEscalation) {
    return {
      type: 'escalation',
      content: `「${ESCALATION_TRIGGERS.find(t => question.includes(t))}」に関するご質問は、ナレッジベースでは確認が難しい専門的・個別的な事項が含まれます。`,
    };
  }

  // パターンマッチング
  for (const pattern of QA_PATTERNS) {
    if (pattern.triggers.some(trigger => question.includes(trigger))) {
      const knowledge = KNOWLEDGE_BASE.find(k => k.id === pattern.knowledgeId);
      return {
        type: 'answer',
        content: pattern.response,
        knowledge,
        confidence: pattern.confidence,
        escalatable: pattern.escalatable,
      };
    }
  }

  // デフォルト回答
  return {
    type: 'not_found',
    content: 'ご質問の内容に関連するナレッジが見つかりませんでした。より具体的な質問に言い換えるか、本社へお問い合わせください。',
  };
}

export default function AIChatPane({ selectedCase }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: '不動産売買仲介に関するご質問にお答えします。案件の工程・書類・法的事項など、何でもご質問ください。',
      type: 'intro',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [escalation, setEscalation] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text) => {
    const question = text || input.trim();
    if (!question) return;
    setInput('');

    const userMsg = { id: Date.now(), role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setEscalation(null);

    setTimeout(() => {
      const result = findResponse(question);

      if (result.type === 'escalation') {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          content: result.content,
          type: 'escalation_trigger',
        }]);
        setEscalation({
          question,
          caseContext: selectedCase ? {
            name: selectedCase.name,
            stage: selectedCase.stages[selectedCase.currentStageIndex]?.name,
            side: selectedCase.side,
          } : null,
        });
      } else if (result.type === 'not_found') {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          content: result.content,
          type: 'not_found',
        }]);
        setEscalation({
          question,
          caseContext: selectedCase ? {
            name: selectedCase.name,
            stage: selectedCase.stages[selectedCase.currentStageIndex]?.name,
            side: selectedCase.side,
          } : null,
        });
      } else {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          content: result.content,
          type: 'answer',
          knowledge: result.knowledge,
          confidence: result.confidence,
          escalatable: result.escalatable,
        }]);
        if (result.escalatable) {
          setEscalation({
            question,
            caseContext: selectedCase ? {
              name: selectedCase.name,
              stage: selectedCase.stages[selectedCase.currentStageIndex]?.name,
              side: selectedCase.side,
            } : null,
          });
        }
      }
      setLoading(false);
    }, 800 + Math.random() * 600);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={styles.pane}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <span className={styles.headerIcon}>🤖</span>
          <span>AI アシスタント</span>
        </div>
        {selectedCase && (
          <div className={styles.caseTag}>
            {selectedCase.name.length > 12 ? selectedCase.name.slice(0, 12) + '…' : selectedCase.name}
          </div>
        )}
      </div>

      {/* サンプル質問 */}
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

      {/* メッセージ */}
      <div className={styles.messages}>
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
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
            caseContext={escalation.caseContext}
            onDismiss={() => setEscalation(null)}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力 */}
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

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const confCfg = msg.confidence ? CONFIDENCE_CONFIG[msg.confidence] : null;

  if (isUser) {
    return (
      <div className={styles.userBubble}>
        <div className={styles.userText}>{msg.content}</div>
      </div>
    );
  }

  return (
    <div className={`${styles.assistantBubble} ${msg.type === 'not_found' || msg.type === 'escalation_trigger' ? styles.warningBubble : ''}`}>
      <div className={styles.bubbleHeader}>
        <span className={styles.bubbleRole}>AI</span>
        {confCfg && (
          <span className={styles.confidenceBadge} style={{ background: confCfg.bg, color: confCfg.color }}>
            信頼度: {msg.confidence}
          </span>
        )}
      </div>
      <div className={styles.bubbleContent}>
        {msg.content.split('\n').map((line, i) => {
          if (line.startsWith('**') && line.endsWith('**')) {
            return <strong key={i} className={styles.bold}>{line.slice(2, -2)}</strong>;
          }
          if (line.startsWith('- ')) {
            return <div key={i} className={styles.listItem}>・{line.slice(2)}</div>;
          }
          if (line.match(/^\d+\./)) {
            return <div key={i} className={styles.listItem}>{line}</div>;
          }
          if (line === '') return <div key={i} className={styles.spacer} />;
          return <div key={i}>{line}</div>;
        })}
      </div>
      {msg.knowledge && (
        <div className={styles.knowledge}>
          <span className={styles.knowledgeIcon}>📚</span>
          <span className={styles.knowledgeTitle}>参照: {msg.knowledge.title}</span>
          <span className={styles.knowledgeCategory}>{msg.knowledge.category}</span>
        </div>
      )}
      {msg.escalatable && (
        <div className={styles.escalatableNote}>
          ⚠️ この内容は個別ケースによって判断が異なる場合があります。詳細は本社に確認することを推奨します。
        </div>
      )}
    </div>
  );
}
