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
  const [showEmojis, setShowEmojis] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const bottomRef                 = useRef(null);

  const { messages, sending, error: chatError, send, flag, typingUsers, emitTyping } = useChat(
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
    if (!input.trim() && !replyingTo) return;
    let finalContent = input.trim();
    if (replyingTo) {
      finalContent = `> Replying to ${replyingTo.name}: ${replyingTo.text.length > 30 ? replyingTo.text.substring(0,30) + '...' : replyingTo.text}\n\n` + finalContent;
    }
    await send(finalContent);
    setInput('');
    setReplyingTo(null);
    setShowEmojis(false);
    emitTyping(false);
  };

  const handleReply = (name, text) => {
    setReplyingTo({ name, text });
  };

  const handleKick = async (targetUserId, anonName) => {
    if (!window.confirm(`Are you sure you want to kick ${anonName}? They will instantly lose 5 Ghost Score points and be banned from this group.`)) return;
    try {
      await groupsApi.kickMember(id, targetUserId);
      alert(`${anonName} has been kicked from the group.`);
    } catch {
      alert("Failed to kick user.");
    }
  };

  const renderMessageContent = (content) => {
    if (content.startsWith('> Replying to ')) {
      const parts = content.split('\n\n');
      const quote = parts[0];
      const rest = parts.slice(1).join('\n\n');
      return (
        <>
          <div style={{ fontSize: '12px', borderLeft: '3px solid var(--primary-c)', paddingLeft: '8px', marginBottom: '8px', color: 'var(--text4)', background: 'var(--bg6)', padding: '6px', borderRadius: '4px' }}>
            {quote.substring(2)}
          </div>
          {rest}
        </>
      );
    }
    return content;
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
            <img key={i} className={styles.mAvatar} src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${id}-${i}`} alt="member" style={{objectFit: 'cover', background: 'var(--bg5)'}} />
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
                className={`${styles.joinBtn} btn-primary`}
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
                <span className={styles.bubbleLabel} style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', width: '100%' }}>
                  You · {msg.anon_name}
                  <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${msg.anon_name || 'Anonymous'}`} alt="avatar" style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                </span>
                <div className={styles.bubbleOut} style={{ position: 'relative' }}>
                  {renderMessageContent(msg.content)}
                  <button className={styles.flagBtn} onClick={() => handleReply('You', msg.content)}>↩</button>
                </div>
                <span className={styles.bubbleOutTime}>{formatTime(msg.createdAt || msg.created_at)}</span>
              </div>
            ) : (
              <div key={msg.id} className={styles.bubbleGroup}>
                <span className={styles.bubbleLabel} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${msg.anon_name || 'Anonymous'}`} alt="avatar" style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                  {msg.anon_name || 'Anonymous'}
                </span>
                <div className={styles.bubbleIn} style={{ position: 'relative' }}>
                  {renderMessageContent(msg.content)}
                  <div style={{ position: 'absolute', top: 6, right: -48, display: 'flex', gap: 4 }}>
                    <button className={styles.flagBtn} style={{ position: 'static' }} onClick={() => handleReply(msg.anon_name || 'Anonymous', msg.content)} title="Reply">↩</button>
                    <button className={styles.flagBtn} style={{ position: 'static' }} onClick={() => flag(msg.id)} title="Flag message">⚑</button>
                    {group.isCreator && (
                      <button className={styles.flagBtn} style={{ position: 'static', color: 'var(--error)' }} onClick={() => handleKick(msg.user_id, msg.anon_name || 'Anonymous')} title="Kick user">✕</button>
                    )}
                  </div>
                </div>
                <span className={styles.bubbleTime}>{formatTime(msg.createdAt || msg.created_at)}</span>
              </div>
            ))}

            <div ref={bottomRef} />
          </div>

          {chatError && <div className={styles.chatError}>{chatError}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', padding: '0 16px 14px', background: 'rgba(14, 10, 24,0.85)', backdropFilter: 'blur(20px)', flexShrink: 0 }}>
            {Object.keys(typingUsers).length > 0 && (
              <div style={{ padding: '0 14px 6px', fontSize: '11px', color: 'var(--primary-c)', fontStyle: 'italic' }}>
                {Object.values(typingUsers).join(', ')} {Object.values(typingUsers).length === 1 ? 'is' : 'are'} typing...
              </div>
            )}
            {replyingTo && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'var(--bg5)', borderRadius: '12px 12px 0 0', border: '1px solid var(--border)', borderBottom: 'none', fontSize: '12px' }}>
                <span style={{ color: 'var(--text4)' }}>Replying to <strong style={{color: 'var(--primary-c)'}}>{replyingTo.name}</strong></span>
                <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: 'var(--text4)' }}>✖</button>
              </div>
            )}
            
            {showEmojis && (
              <div style={{ display: 'flex', gap: '8px', padding: '10px 14px', background: 'var(--bg6)', borderRadius: replyingTo ? '0' : '12px 12px 0 0', overflowX: 'auto', border: '1px solid var(--border)', borderBottom: 'none' }}>
                {['🔥', '😂', '💯', '👀', '✨', '💀', '🙏', '🤔', '❤️', '🙌'].map(em => (
                  <button key={em} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }} onClick={() => { setInput(i => i + em); setShowEmojis(false); }}>
                    {em}
                  </button>
                ))}
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className={styles.inputShell} style={{ borderRadius: (replyingTo || showEmojis) ? '0 0 12px 12px' : 'var(--radius-full)' }}>
                <input
                  className={styles.chatInput}
                  placeholder="Send a message..."
                  value={input}
                  onChange={e => {
                    const val = e.target.value;
                    setInput(val);
                    if (val.length === 1 && input.length === 0) emitTyping(true);
                    else if (val.length === 0) emitTyping(false);
                  }}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  maxLength={500}
                />
                <button className={styles.emojiBtn} onClick={() => setShowEmojis(v => !v)}>
                  <span className="material-symbols-outlined">mood</span>
                </button>
              </div>
              <button
                className={`${styles.sendBtn} btn-primary`}
                onClick={handleSend}
                disabled={sending || (!input.trim() && !replyingTo)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>send</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
