import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupsApi, joinApi } from '../../../shared/api/index.js';
import { useChat } from '../../../shared/hooks/useChat.js';
import { useSessionStore } from '../../../shared/store/sessionStore.js';
import { getSocket } from '../../../shared/hooks/useSocket.js';
import { templateLabel, expiresIn } from '../../../shared/utils/index.js';
import JoinRequestsPanel from '../components/JoinRequestsPanel.jsx';
import styles from './GroupPage.module.css';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function GroupPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useSessionStore();

  const [group, setGroup]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [joinReason, setJoinReason] = useState('');
  const [joinState, setJoinState] = useState('idle');
  const [showRequests, setShowRequests] = useState(false);
  const [input, setInput]         = useState('');
  const bottomRef                 = useRef(null);

  const { messages, sending, error: chatError, send, flag } = useChat(
  group?.isMember ? id : null,
  token,
  user?.id
);
  useEffect(() => {
    groupsApi.get(id)
      .then(g => { setGroup(g); setLoading(false); })
      .catch(() => navigate('/'));
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    if (!socket) return;
    const handler = ({ groupId, status }) => {
      if (groupId !== id) return;
      setJoinState(status);
      if (status === 'approved') groupsApi.get(id).then(setGroup);
    };
    socket.on('join_request_result', handler);
    return () => socket.off('join_request_result', handler);
  }, [token, id]);

  const handleJoin = async () => {
    if (!joinReason.trim()) return;
    setJoinState('submitting');
    try {
      await joinApi.submit(id, joinReason);
      setJoinState('pending');
    } catch { setJoinState('idle'); }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    await send(input.trim());
    setInput('');
  };

  if (loading) return <div className={styles.loading}>Locating group…</div>;
  if (!group)  return null;

  const memberCount = group.memberCount || 1;
  const shown = Math.min(memberCount, 2);
  const extra = memberCount > 2 ? `+${memberCount - 2}` : null;

  return (
    <div className={styles.page}>
      {/* Chat header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className={styles.headerInfo}>
          <div className={styles.groupName}>{group.name}</div>
          <div className={styles.groupSub}>{memberCount} Active Members</div>
        </div>
        <div className={styles.memberAvatars}>
          {Array.from({ length: shown }).map((_, i) => (
            <div key={i} className={styles.mAvatar} />
          ))}
          {extra && <div className={styles.mMore}>{extra}</div>}
        </div>
      </div>

      {/* Creator requests */}
      {group.isCreator && (
        <button className={styles.requestsBtn} onClick={() => setShowRequests(v => !v)}>
          {showRequests ? 'Hide join requests' : 'View join requests'}
        </button>
      )}
      {showRequests && <JoinRequestsPanel groupId={id} onClose={() => setShowRequests(false)} />}

      {/* Join gate */}
      {!group.isMember && (
        <div className={styles.joinGate}>
          {(joinState === 'idle' || joinState === 'submitting') ? (
            <>
              <div className={styles.joinTitle}>Request to join</div>
              <div className={styles.joinSub}>
                Tell the creator why you want to join — one line. They only see the reason, never who you are.
              </div>
              {group.minGhostScore > 0 && (
                <div className={styles.ghostReq}>
                  ⚡ Requires Ghost Trail score ≥ {group.minGhostScore}
                </div>
              )}
              <textarea
                className={styles.reasonInput}
                placeholder="Why do you want to join?"
                rows={3} maxLength={160}
                value={joinReason}
                onChange={e => setJoinReason(e.target.value)}
              />
              <button
                className={`${styles.joinBtn} btn-orange`}
                onClick={handleJoin}
                disabled={joinState === 'submitting' || !joinReason.trim()}
              >
                {joinState === 'submitting' ? 'Sending…' : 'Send Request'}
              </button>
            </>
          ) : joinState === 'pending' ? (
            <div className={styles.pendingWrap}>
              <div className={styles.pendingIcon}>⏳</div>
              <div className={styles.pendingTitle}>Request sent</div>
              <div className={styles.pendingSub}>Waiting for the creator. You'll be notified instantly.</div>
            </div>
          ) : joinState === 'approved' ? (
            <div className={styles.pendingWrap}><div className={styles.approvedMsg}>✅ Approved! Welcome.</div></div>
          ) : (
            <div className={styles.pendingWrap}><div className={styles.rejectedMsg}>Request wasn't approved.</div></div>
          )}
        </div>
      )}

      {/* Chat */}
      {group.isMember && (
        <>
          <div className={styles.messages}>
            {/* Timestamp header */}
            <div className={styles.timestamp}>
              <span className={styles.timestampLabel}>
                Today • {templateLabel(group.template)} • ⏱ {expiresIn(group.expiresAt)}
              </span>
            </div>

            {messages.length === 0 && (
              <div className={styles.emptyChat}>No messages yet. Say something.</div>
            )}

            {messages.map(msg => msg.isMine ? (
              <div key={msg.id} className={styles.bubbleOutGroup}>
                <span className={styles.bubbleLabel} style={{ textAlign: 'right', display: 'block' }}>
                  You · {msg.anon_name}
                </span>
                <div className={styles.bubbleOut}>{msg.content}</div>
                <span className={styles.bubbleOutTime}>{formatTime(msg.createdAt || msg.created_at)}</span>
              </div>
            ) : (
              <div key={msg.id} className={styles.bubbleGroup}>
                <span className={styles.bubbleLabel}>{msg.anon_name || 'Anonymous'}</span>
                <div className={styles.bubbleIn} style={{ position: 'relative' }}>
                  {msg.content}
                  <button className={styles.flagBtn} onClick={() => flag(msg.id)}>⚑</button>
                </div>
                <span className={styles.bubbleTime}>{formatTime(msg.createdAt || msg.created_at)}</span>
              </div>
            ))}

            <div ref={bottomRef} />
          </div>

          {chatError && <div className={styles.chatError}>{chatError}</div>}

          <div className={styles.inputRow}>
            <div className={styles.inputShell}>
              <button className={styles.addBtn}>
                <span className="material-symbols-outlined">add_circle</span>
              </button>
              <input
                className={styles.chatInput}
                placeholder="Send a message..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                maxLength={500}
              />
              <button className={styles.emojiBtn}>
                <span className="material-symbols-outlined">mood</span>
              </button>
            </div>
            <button
              className={`${styles.sendBtn} btn-orange`}
              onClick={handleSend}
              disabled={sending || !input.trim()}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
