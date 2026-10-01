import re

with open('components/whatsapp/MessageList.jsx', 'r') as f:
    content = f.read()

# 1. Update EmojiSideBtn to use position: absolute
old_btn_style = """    <div
      ref={ref}
      style={{
        position: 'relative',
        flexShrink: 0,
        alignSelf: 'flex-end',
        marginBottom: 6,
        opacity: hovered || open ? 1 : 0,
        pointerEvents: hovered || open ? 'auto' : 'none',
        transition: 'opacity 0.15s',
      }}
    >"""

new_btn_style = """    <div
      ref={ref}
      style={{
        position: 'absolute',
        bottom: 6,
        [isMe ? 'right' : 'left']: '100%',
        marginRight: isMe ? 4 : 0,
        marginLeft: isMe ? 0 : 4,
        zIndex: 10,
        opacity: hovered || open ? 1 : 0,
        pointerEvents: hovered || open ? 'auto' : 'none',
        transition: 'opacity 0.15s',
      }}
    >"""

content = content.replace(old_btn_style, new_btn_style)

# 2. Remove EmojiSideBtn from the flex flow in MessageBubble
# Before:
#      {/* [☺ btn LEFT] [bubble] for sent — [bubble] [☺ btn RIGHT] for received */}
#      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, maxWidth: '65%' }}>
#
#        {isMe && <EmojiSideBtn hovered={hovered} isMe={true} msgId={msg.id} onReact={onReact} setHovered={setHovered} />}
#
#        <div style={{ position: 'relative', flex: 1, minWidth: 80 }}>

old_layout = """      {/* [☺ btn LEFT] [bubble] for sent — [bubble] [☺ btn RIGHT] for received */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, maxWidth: '65%' }}>

        {isMe && <EmojiSideBtn hovered={hovered} isMe={true} msgId={msg.id} onReact={onReact} setHovered={setHovered} />}

        <div style={{ position: 'relative', flex: 1, minWidth: 80 }}>"""

new_layout = """      {/* The container is positioned relative so the absolute EmojiSideBtn anchors to it */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', maxWidth: '65%' }}>

        <div style={{ position: 'relative', flex: 1, minWidth: 80 }}>"""

content = content.replace(old_layout, new_layout)

# 3. Add EmojiSideBtn inside the relative container, after the bubble wrapper
old_end = """        </div>

        {!isMe && <EmojiSideBtn hovered={hovered} isMe={false} msgId={msg.id} onReact={onReact} setHovered={setHovered} />}
      </div>
    </div>
  );
}"""

new_end = """        </div>

        {/* The smiley button is absolutely positioned relative to the outer div */}
        <EmojiSideBtn hovered={hovered} isMe={isMe} msgId={msg.id} onReact={onReact} setHovered={setHovered} />
      </div>
    </div>
  );
}"""

content = content.replace(old_end, new_end)

with open('components/whatsapp/MessageList.jsx', 'w') as f:
    f.write(content)

print("Updated MessageList.jsx layout")
