import re

with open('components/whatsapp/MessageList.jsx', 'r') as f:
    content = f.read()

# 1. Update the outer container margin (remove the conditional 26px)
old_outer = """    <div
      style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: reactGroups.length > 0 ? 26 : 4 }}
      onMouseEnter={() => setHovered(true)}"""

new_outer = """    <div
      style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 4 }}
      onMouseEnter={() => setHovered(true)}"""

content = content.replace(old_outer, new_outer)


# 2. Update the inner wrapper to be a flex column
old_wrapper = """        <div style={{ position: 'relative', flex: 1, minWidth: 80 }}>
          <div style={{ background: bubbleBg, borderRadius: bubbleRadius, boxShadow: '0 1px 2px rgba(0,0,0,0.13)', position: 'relative', overflow: 'visible' }}>"""

new_wrapper = """        <div style={{ position: 'relative', flex: 1, minWidth: 80, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: bubbleBg, borderRadius: bubbleRadius, boxShadow: '0 1px 2px rgba(0,0,0,0.13)', position: 'relative', overflow: 'visible' }}>"""

content = content.replace(old_wrapper, new_wrapper)


# 3. Change the reaction pill from absolute to relative with negative margin
old_pill = """          {reactGroups.length > 0 && (
            <div style={{
              position: 'absolute', bottom: -20,
              ...(isMe ? { right: 8 } : { left: 8 }),
              display: 'flex', alignItems: 'center', gap: 2,
              background: '#fff', borderRadius: 100, padding: '2px 6px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)', border: '1px solid rgba(0,0,0,0.06)', zIndex: 3,
            }}>
              {reactGroups.map(({ emoji }, i) => <span key={i} style={{ fontSize: 15, lineHeight: 1 }}>{emoji}</span>)}
              {reactions.length > 1 && <span style={{ fontSize: 11, color: '#667781', marginLeft: 2, fontWeight: 600 }}>{reactions.length}</span>}
            </div>
          )}"""

new_pill = """          {reactGroups.length > 0 && (
            <div style={{
              alignSelf: isMe ? 'flex-end' : 'flex-start',
              marginTop: -12, // Pull up to overlap bubble edge
              marginRight: isMe ? 8 : 0,
              marginLeft: isMe ? 0 : 8,
              position: 'relative', // for z-index
              display: 'flex', alignItems: 'center', gap: 2,
              background: '#fff', borderRadius: 100, padding: '2px 6px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)', border: '1px solid rgba(0,0,0,0.06)', zIndex: 10,
            }}>
              {reactGroups.map(({ emoji }, i) => <span key={i} style={{ fontSize: 15, lineHeight: 1 }}>{emoji}</span>)}
              {reactions.length > 1 && <span style={{ fontSize: 11, color: '#667781', marginLeft: 2, fontWeight: 600 }}>{reactions.length}</span>}
            </div>
          )}"""

content = content.replace(old_pill, new_pill)

with open('components/whatsapp/MessageList.jsx', 'w') as f:
    f.write(content)

print("Fixed reaction pill stacking and layout")
