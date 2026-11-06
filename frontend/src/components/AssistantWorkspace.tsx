"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { ArrowUp, CheckCircle2 } from "lucide-react";

export interface AssistantMessage {
  sender: "user" | "agent";
  text: string;
  time: string;
  actions?: Array<{ label: string; tab?: string; kind?: string }>;
}

export interface AssistantStat {
  key: string;
  label: string;
  value: number;
  icon: ReactNode;
  onClick: () => void;
}

export interface AssistantTodoGroup {
  key: string;
  title: string;
  icon: ReactNode;
  items: Array<{
    id: string;
    title: string;
    subtitle?: ReactNode;
    actions: Array<{ label: string; icon?: ReactNode; primary?: boolean; onClick: () => void }>;
  }>;
}

interface AssistantWorkspaceProps {
  stats: AssistantStat[];
  groups: AssistantTodoGroup[];
  suggestions: Array<{ label: string; prompt: string }>;
  messages: AssistantMessage[];
  thinking: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onAsk: (text: string) => void;
  onOpenTab: (tab: string) => void;
  renderAgentText: (message: AssistantMessage, isLatest: boolean) => ReactNode;
  scrollRef: RefObject<HTMLDivElement | null>;
  endRef: RefObject<HTMLDivElement | null>;
}

/**
 * Espace de l'assistante : la discussion et la liste de ce qu'il reste à faire.
 * Sur grand écran, les deux sont côte à côte ; sur téléphone, on passe de l'une à l'autre.
 */
export function AssistantWorkspace({
  stats,
  groups,
  suggestions,
  messages,
  thinking,
  input,
  onInputChange,
  onAsk,
  onOpenTab,
  renderAgentText,
  scrollRef,
  endRef,
}: AssistantWorkspaceProps) {
  const [view, setView] = useState<"chat" | "todo">("chat");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const todoCount = groups.reduce((total, group) => total + group.items.length, 0);

  // La zone de saisie grandit avec le message, jusqu'à cinq lignes.
  useEffect(() => {
    const field = textareaRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, 124)}px`;
  }, [input]);

  useEffect(() => {
    if (view === "chat" && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [view, scrollRef]);

  const send = () => {
    if (input.trim() && !thinking) onAsk(input);
  };

  return (
    <div className="aw animate-fade-in">
      <div className="aw-stats">
        {stats.map((stat) => (
          <button key={stat.key} type="button" onClick={stat.onClick} className={stat.value > 0 ? "alert" : ""}>
            <span className="aw-stat-icon">{stat.icon}</span>
            <span className="aw-stat-text">
              <strong>{stat.value}</strong>
              <small>{stat.label}</small>
            </span>
          </button>
        ))}
      </div>

      <div className="aw-switch" role="tablist" aria-label="Affichage">
        <button type="button" role="tab" aria-selected={view === "chat"} onClick={() => setView("chat")}>
          Discussion
        </button>
        <button type="button" role="tab" aria-selected={view === "todo"} onClick={() => setView("todo")}>
          À faire{todoCount > 0 ? ` (${todoCount})` : ""}
        </button>
      </div>

      <div className="aw-body" data-view={view}>
        <section className="aw-chat" aria-label="Discussion avec l'assistante">
          <header className="aw-chat-head">
            <img src="/icon-192.png" alt="" />
            <div>
              <strong>Assistante Roum</strong>
              <span className={thinking ? "busy" : ""}>{thinking ? "Prépare votre réponse..." : "En ligne"}</span>
            </div>
          </header>

          <div className="aw-messages" ref={scrollRef}>
            {messages.map((message, index) => {
              const mine = message.sender === "user";
              return (
                <div key={index} className={mine ? "aw-msg mine" : "aw-msg"}>
                  <div className="aw-bubble">
                    {mine ? message.text : renderAgentText(message, index === messages.length - 1)}
                    {!mine && message.actions && message.actions.length > 0 && (
                      <div className="aw-bubble-actions">
                        {message.actions.map((action) => (
                          <button
                            key={action.label}
                            type="button"
                            onClick={() => action.tab && onOpenTab(action.tab)}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <time>{message.time}</time>
                </div>
              );
            })}

            {thinking && (
              <div className="aw-msg">
                <div className="aw-bubble aw-dots" aria-label="L'assistante écrit">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            )}

            <div ref={endRef} style={{ height: 1 }} />
          </div>

          <div className="aw-composer-wrap">
            <div className="aw-suggestions">
              {suggestions.map((suggestion) => (
                <button key={suggestion.label} type="button" disabled={thinking} onClick={() => onAsk(suggestion.prompt)}>
                  {suggestion.label}
                </button>
              ))}
            </div>

            <form
              className="aw-composer"
              onSubmit={(event) => {
                event.preventDefault();
                send();
              }}
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                placeholder="Écrivez votre message..."
                aria-label="Votre message"
                enterKeyHint="send"
                disabled={thinking}
                onChange={(event) => onInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
              />
              <button type="submit" disabled={!input.trim() || thinking} aria-label="Envoyer">
                <ArrowUp size={19} strokeWidth={2.4} />
              </button>
            </form>
          </div>
        </section>

        <aside className="aw-todo" aria-label="À faire">
          <h3>
            À faire
            {todoCount > 0 && <span>{todoCount}</span>}
          </h3>

          {todoCount === 0 ? (
            <div className="aw-empty">
              <CheckCircle2 size={32} />
              <strong>Tout est à jour</strong>
              <p>Aucun paiement, aucune pesée et aucune demande en attente.</p>
            </div>
          ) : (
            groups
              .filter((group) => group.items.length > 0)
              .map((group) => (
                <div key={group.key} className="aw-group">
                  <h4>
                    {group.icon}
                    {group.title}
                    <em>{group.items.length}</em>
                  </h4>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <div className="aw-item-text">
                          <strong>{item.title}</strong>
                          {item.subtitle && <span>{item.subtitle}</span>}
                        </div>
                        <div className="aw-item-actions">
                          {item.actions.map((action) => (
                            <button
                              key={action.label}
                              type="button"
                              className={action.primary ? "primary" : ""}
                              onClick={action.onClick}
                            >
                              {action.icon}
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
          )}
        </aside>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .aw {
          display: grid;
          gap: 16px;
          min-width: 0;
        }

        .aw-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .aw-stats button {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
          padding: 12px 14px;
          border: 1px solid var(--border-light);
          border-radius: 18px;
          background: #FFFFFF;
          color: var(--text-main);
          text-align: left;
          cursor: pointer;
          transition: border-color 0.15s ease, transform 0.15s ease;
        }

        .aw-stats button:hover {
          border-color: #DCCDB6;
          transform: translateY(-1px);
        }

        .aw-stat-icon {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #F3EBDF;
          color: #3A2A21;
        }

        .aw-stats button.alert .aw-stat-icon {
          background: #EADDCB;
        }

        .aw-stat-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
          line-height: 1.2;
        }

        .aw-stat-text strong {
          font-size: 1.3rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .aw-stat-text small {
          color: var(--text-muted);
          font-size: 0.76rem;
          white-space: nowrap;
        }

        .aw-switch {
          display: none;
        }

        .aw-body {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(300px, 1fr);
          align-items: start;
          gap: 16px;
        }

        .aw-chat {
          display: flex;
          flex-direction: column;
          min-width: 0;
          height: clamp(520px, calc(100dvh - 290px), 780px);
          overflow: hidden;
          border: 1px solid var(--border-light);
          border-radius: 24px;
          background: #FBF7F1;
        }

        .aw-chat-head {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 12px 16px;
          border-bottom: 1px solid #EFE6D9;
          background: #FFFDF9;
        }

        .aw-chat-head img {
          width: 42px;
          height: 42px;
          border-radius: 50%;
        }

        .aw-chat-head strong {
          display: block;
          color: var(--text-main);
          font-size: 0.98rem;
          font-weight: 800;
        }

        .aw-chat-head span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
          font-size: 0.78rem;
        }

        .aw-chat-head span::before {
          content: "";
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2E9E5B;
        }

        .aw-chat-head span.busy::before {
          background: #C9A06C;
        }

        .aw-messages {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }

        .aw-msg {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 3px;
          max-width: min(88%, 620px);
        }

        .aw-msg.mine {
          align-self: flex-end;
          align-items: flex-end;
        }

        .aw-msg time {
          padding: 0 8px;
          color: #A99A90;
          font-size: 0.68rem;
        }

        .aw-bubble {
          padding: 11px 15px;
          border: 1px solid #EFE6D9;
          border-radius: 20px 20px 20px 6px;
          background: #FFFFFF;
          color: var(--text-main);
          font-size: 0.92rem;
          line-height: 1.5;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
        }

        .aw-msg.mine .aw-bubble {
          border-color: #EADDCB;
          border-radius: 20px 20px 6px 20px;
          background: #EADDCB;
          color: #3A2A21;
        }

        .aw-bubble-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
          white-space: normal;
        }

        .aw-bubble-actions button {
          min-height: 36px;
          padding: 0 13px;
          border: 0;
          border-radius: 9999px;
          background: #F3EBDF;
          color: #3A2A21;
          font-family: inherit;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
        }

        .aw-bubble-actions button:hover {
          background: #EADDCB;
        }

        .aw-dots {
          display: inline-flex;
          gap: 5px;
          padding: 14px 16px;
        }

        .aw-dots i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #C9A06C;
          animation: aw-dot 1.1s ease-in-out infinite;
        }

        .aw-dots i:nth-child(2) {
          animation-delay: 0.15s;
        }

        .aw-dots i:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes aw-dot {
          0%, 60%, 100% {
            opacity: 0.35;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }

        .aw-composer-wrap {
          flex-shrink: 0;
          display: grid;
          gap: 8px;
          padding: 10px 12px calc(12px + env(safe-area-inset-bottom, 0px));
          border-top: 1px solid #EFE6D9;
          background: #FFFDF9;
        }

        .aw-suggestions {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .aw-suggestions::-webkit-scrollbar {
          display: none;
        }

        .aw-suggestions button {
          flex-shrink: 0;
          min-height: 36px;
          padding: 0 14px;
          border: 1px solid #E3D8CA;
          border-radius: 9999px;
          background: transparent;
          color: #3A2A21;
          font-family: inherit;
          font-size: 0.82rem;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
        }

        .aw-suggestions button:hover:not(:disabled) {
          background: #F3EBDF;
        }

        .aw-suggestions button:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .aw-composer {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          padding: 5px 5px 5px 18px;
          border: 1px solid #E3D8CA;
          border-radius: 26px;
          background: #FFFFFF;
        }

        .aw-composer:focus-within {
          border-color: #A8957C;
        }

        .aw-composer textarea {
          flex: 1;
          min-width: 0;
          max-height: 124px;
          padding: 9px 0;
          border: 0;
          outline: none;
          resize: none;
          scrollbar-width: none;
          background: transparent;
          color: var(--text-main);
          font-family: inherit;
          font-size: 0.95rem;
          line-height: 1.4;
        }

        .aw-composer textarea::-webkit-scrollbar {
          display: none;
        }

        .aw-composer textarea::placeholder {
          color: #A99A90;
        }

        .aw-composer button {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border: 0;
          border-radius: 50%;
          background: #EADDCB;
          color: #3A2A21;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .aw-composer button:hover:not(:disabled) {
          background: #E0D1BB;
        }

        .aw-composer button:disabled {
          background: #F3EFE8;
          color: #B8ABA3;
          cursor: default;
        }

        .aw-todo {
          display: grid;
          gap: 18px;
          min-width: 0;
          max-height: clamp(520px, calc(100dvh - 290px), 780px);
          padding: 18px;
          overflow-y: auto;
          border: 1px solid var(--border-light);
          border-radius: 24px;
          background: #FFFFFF;
        }

        .aw-todo h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          color: var(--text-main);
          font-size: 1.1rem;
          font-weight: 800;
        }

        .aw-todo h3 span {
          padding: 2px 9px;
          border-radius: 9999px;
          background: #EADDCB;
          color: #3A2A21;
          font-size: 0.78rem;
        }

        .aw-group h4 {
          display: flex;
          align-items: center;
          gap: 7px;
          margin: 0 0 4px;
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 700;
        }

        .aw-group h4 em {
          margin-left: auto;
          font-style: normal;
        }

        .aw-group ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .aw-group li {
          display: grid;
          gap: 8px;
          padding: 11px 0;
          border-bottom: 1px solid #F1EAE0;
        }

        .aw-group li:last-child {
          border-bottom: 0;
        }

        .aw-item-text {
          min-width: 0;
        }

        .aw-item-text strong {
          display: block;
          color: var(--text-main);
          font-size: 0.9rem;
          font-weight: 700;
          line-height: 1.3;
          overflow-wrap: anywhere;
        }

        .aw-item-text > span {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 2px 5px;
          margin-top: 3px;
          color: var(--text-secondary);
          font-size: 0.8rem;
        }

        .aw-item-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .aw-item-actions button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 38px;
          padding: 0 15px;
          border: 1px solid #E3D8CA;
          border-radius: 9999px;
          background: transparent;
          color: #3A2A21;
          font-family: inherit;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
        }

        .aw-item-actions button.primary {
          border-color: #EADDCB;
          background: #EADDCB;
        }

        .aw-item-actions button:hover {
          background: #F3EBDF;
        }

        .aw-item-actions button.primary:hover {
          background: #E0D1BB;
        }

        .aw-empty {
          display: grid;
          justify-items: center;
          gap: 6px;
          padding: 30px 12px;
          color: var(--text-main);
          text-align: center;
        }

        .aw-empty p {
          margin: 0;
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        /* Tablette et téléphone : une seule colonne, on passe de la discussion à la liste. */
        @media (max-width: 1180px) {
          .aw-switch {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 4px;
            padding: 4px;
            border-radius: 9999px;
            background: #F3EBDF;
          }

          .aw-switch button {
            min-height: 42px;
            border: 0;
            border-radius: 9999px;
            background: transparent;
            color: var(--text-muted);
            font-family: inherit;
            font-size: 0.92rem;
            font-weight: 700;
            cursor: pointer;
          }

          .aw-switch button[aria-selected="true"] {
            background: #FFFFFF;
            color: #3A2A21;
          }

          .aw-body {
            grid-template-columns: minmax(0, 1fr);
          }

          .aw-body[data-view="chat"] .aw-todo,
          .aw-body[data-view="todo"] .aw-chat {
            display: none;
          }

          .aw-todo {
            max-height: none;
            overflow: visible;
          }
        }

        @media (max-width: 760px) {
          /* Le nom de l'assistante figure déjà dans la discussion : la saisie reste visible sans défiler. */
          .admin-main-viewport:has(.aw) .admin-page-head {
            display: none !important;
          }

          .aw {
            gap: 12px;
          }

          /* Les chiffres tiennent sur une ligne qui glisse : la discussion garde la place. */
          .aw-stats {
            display: flex;
            gap: 8px;
            margin: 0 -14px;
            padding: 0 14px 2px;
            overflow-x: auto;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }

          .aw-stats::-webkit-scrollbar {
            display: none;
          }

          .aw-stats button {
            flex: 0 0 auto;
            padding: 8px 14px 8px 8px;
            border-radius: 9999px;
          }

          .aw-stat-icon {
            width: 32px;
            height: 32px;
          }

          .aw-stat-text {
            flex-direction: row;
            align-items: baseline;
            gap: 5px;
          }

          .aw-stat-text strong {
            font-size: 1.02rem;
          }

          .aw-chat {
            height: max(360px, calc(100dvh - 216px));
            border-radius: 22px;
          }

          .aw-messages {
            padding: 12px;
          }

          .aw-msg {
            max-width: 92%;
          }

          .aw-composer-wrap {
            padding: 8px 10px calc(10px + env(safe-area-inset-bottom, 0px));
          }

          .aw-todo {
            padding: 16px;
            border-radius: 22px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .aw-dots i {
            animation: none;
          }
        }
      `,
        }}
      />
    </div>
  );
}
