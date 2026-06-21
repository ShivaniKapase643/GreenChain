import React, { useEffect, useRef, useState } from 'react';
import { useAIInsights } from '../../hooks/useAIInsights';
import { AIChatBubble, TypingIndicator } from '../components/Chat';
import { Card, Icon, SectionTitle } from '../components/UI';
import { PageHero } from '../components/Shell';
import { theme } from '../theme';

const quickPrompts = [
  { label: 'How can we reduce CO2 this week?', icon: 'eco' },
  { label: 'Top 3 green route optimizations today', icon: 'route' },
  { label: 'Which shipments are highest emission risk?', icon: 'warning' },
];

export const InsightsPage: React.FC = () => {
  const { messages, isLoading, sendMessage } = useAIInsights();
  const [inputText, setInputText] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputText.trim()) {
      return;
    }

    await sendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="gc-page gc-page--chat">
      <PageHero
        title="AI Insights"
        subtitle="Ask about emissions, routes, and sustainability targets."
        icon="smart_toy"
      />

      <Card className="gc-chat-hero">
        <div className="gc-chat-hero__badge">
          <Icon name="auto_awesome" size={14} color={theme.colors.primaryDeep} />
          AI Powered
        </div>
        <h3>Ask GreenChain AI</h3>
        <p>Get clear actions on emissions, routes, and sustainability targets.</p>
        <div className="gc-chip-row">
          {quickPrompts.map(prompt => (
            <button key={prompt.label} className="gc-chip gc-chip--soft" onClick={() => setInputText(prompt.label)}>
              <Icon name={prompt.icon} size={14} color={theme.colors.secondary} />
              {prompt.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="gc-chat-panel">
        <SectionTitle title="Conversation" subtitle="A running history of your AI questions and answers." icon="forum" />
        <div className="gc-chat-list" ref={listRef}>
          {messages.length === 0 && !isLoading ? (
            <div className="gc-empty-chat">
              <div className="gc-empty-chat__orb">
                <Icon name="auto_awesome" size={30} color={theme.colors.primaryDeep} />
              </div>
              <strong>No messages yet</strong>
              <p>Pick a suggestion or type a question to start the conversation.</p>
            </div>
          ) : (
            <>
              {messages.map(message => (
                <AIChatBubble key={message.id} message={message} />
              ))}
              {isLoading ? <TypingIndicator /> : null}
            </>
          )}
        </div>
      </Card>

      <Card className="gc-chat-input">
        <div className="gc-chat-input__field">
          <Icon name="chat_bubble" size={18} color={theme.colors.primary} />
          <textarea
            value={inputText}
            onChange={event => setInputText(event.target.value)}
            placeholder="Ask about emissions, routes, or targets..."
            maxLength={500}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
          />
        </div>

        <div className="gc-chat-input__actions">
          <span className="gc-chat-input__count">{inputText.length} / 500</span>
          <button className="gc-button gc-button--primary" disabled={!inputText.trim() || isLoading} onClick={() => void handleSend()}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </Card>
    </div>
  );
};
