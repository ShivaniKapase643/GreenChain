import React from 'react';
import { Icon } from './UI';
import { theme } from '../theme';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
};

const inlineMarkdown = (text: string, baseClass: string) => {
  const pieces: React.ReactNode[] = [];
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/gs;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      pieces.push(<span key={`${baseClass}-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    if (match[2]) {
      pieces.push(<strong key={`${baseClass}-${match.index}-bi`}><em>{match[2]}</em></strong>);
    } else if (match[3]) {
      pieces.push(<strong key={`${baseClass}-${match.index}-b`}>{match[3]}</strong>);
    } else if (match[4]) {
      pieces.push(<em key={`${baseClass}-${match.index}-i`}>{match[4]}</em>);
    } else if (match[5]) {
      pieces.push(<code key={`${baseClass}-${match.index}-c`}>{match[5]}</code>);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    pieces.push(<span key={`${baseClass}-tail`}>{text.slice(lastIndex)}</span>);
  }

  return pieces.length > 0 ? pieces : text;
};

const renderMarkdown = (text: string, isUser: boolean) => {
  const baseColor = isUser ? '#fff' : theme.colors.text;
  const secondaryColor = isUser ? 'rgba(255,255,255,0.8)' : theme.colors.textSoft;
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trimEnd();
    const key = `line-${index}`;

    if (!trimmed.trim()) {
      blocks.push(<div key={key} style={{ height: 6 }} />);
      return;
    }

    if (/^###\s+/.test(trimmed)) {
      blocks.push(
        <h4 key={key} className="gc-md-h3" style={{ color: baseColor }}>
          {inlineMarkdown(trimmed.replace(/^###\s+/, ''), key)}
        </h4>,
      );
      return;
    }

    if (/^##\s+/.test(trimmed)) {
      blocks.push(
        <h3 key={key} className="gc-md-h2" style={{ color: baseColor }}>
          {inlineMarkdown(trimmed.replace(/^##\s+/, ''), key)}
        </h3>,
      );
      return;
    }

    if (/^#\s+/.test(trimmed)) {
      blocks.push(
        <h2 key={key} className="gc-md-h1" style={{ color: baseColor }}>
          {inlineMarkdown(trimmed.replace(/^#\s+/, ''), key)}
        </h2>,
      );
      return;
    }

    if (/^-{3,}$/.test(trimmed)) {
      blocks.push(<div key={key} className="gc-md-divider" style={{ background: secondaryColor }} />);
      return;
    }

    const bulletMatch = trimmed.match(/^([-*•])\s+(.+)$/);
    if (bulletMatch) {
      blocks.push(
        <div key={key} className="gc-md-row">
          <span className="gc-md-bullet" style={{ background: secondaryColor }} />
          <p style={{ color: baseColor }}>{inlineMarkdown(bulletMatch[2], key)}</p>
        </div>,
      );
      return;
    }

    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (orderedMatch) {
      blocks.push(
        <div key={key} className="gc-md-row">
          <span className="gc-md-number" style={{ color: secondaryColor }}>{orderedMatch[1]}.</span>
          <p style={{ color: baseColor }}>{inlineMarkdown(orderedMatch[2], key)}</p>
        </div>,
      );
      return;
    }

    blocks.push(<p key={key} className="gc-md-paragraph" style={{ color: baseColor }}>{inlineMarkdown(trimmed, key)}</p>);
  });

  return <div>{blocks}</div>;
};

export const AIChatBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`gc-chat-message ${isUser ? 'is-user' : 'is-ai'}`}>
      {!isUser ? (
        <div className="gc-chat-message__label">
          <span className="gc-chat-avatar"><Icon name="auto_awesome" size={12} color={theme.colors.primary} /></span>
          <span>GreenChain AI</span>
        </div>
      ) : null}
      <div className={`gc-chat-bubble ${isUser ? 'is-user' : 'is-ai'}`}>
        {renderMarkdown(message.text, isUser)}
        <div className={`gc-chat-time ${isUser ? 'is-user' : 'is-ai'}`}>
          {!isUser ? <Icon name="verified" size={10} color={theme.colors.primary} /> : null}
          <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
};

export const TypingIndicator: React.FC = () => (
  <div className="gc-typing">
    <div className="gc-chat-message__label">
      <span className="gc-chat-avatar"><Icon name="auto_awesome" size={12} color={theme.colors.primary} /></span>
      <span>GreenChain AI is thinking...</span>
    </div>
    <div className="gc-typing__dots">
      <span />
      <span />
      <span />
    </div>
  </div>
);
