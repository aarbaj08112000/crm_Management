import React, { useState } from 'react';
import ContactForm from './ContactForm';

export default function ContactList({ contacts, onSelectContact, selectedContact, onContactUpdated }) {
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState('');

  const COLORS = ['#06cf9c','#25d366','#00a884','#53bdeb','#e9c46a','#f4a261','#e76f51','#2a9d8f'];

  function getColor(name) {
    let hash = 0;
    for (let i = 0; i < (name || 'X').length; i++) hash = (name || 'X').charCodeAt(i) + ((hash << 5) - hash);
    return COLORS[Math.abs(hash) % COLORS.length];
  }

  const filtered = contacts.filter(c =>
    (c.name || c.phone).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full" style={{ background: '#fff' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: '#f0f2f5', borderBottom: '1px solid #e9edef' }}>
        <span className="font-semibold text-lg" style={{ color: '#111b21' }}>Chats</span>
        <button
          onClick={() => setIsAdding(true)}
          title="Add Contact"
          className="rounded-full flex items-center justify-center transition hover:opacity-80"
          style={{ background: '#25d366', width: 36, height: 36 }}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2" style={{ background: '#f0f2f5' }}>
        <div className="flex items-center rounded-lg px-3 py-1.5 gap-2" style={{ background: '#fff' }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="#8696a0" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search or start new chat"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 outline-none text-sm bg-transparent"
            style={{ color: '#111b21' }}
          />
        </div>
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto" style={{ background: '#fff' }}>
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm" style={{ color: '#8696a0' }}>No contacts found</div>
        ) : (
          filtered.map((contact, i) => {
            const isActive = selectedContact?.id === contact.id || selectedContact?.phone === contact.phone;
            const initials = (contact.name || contact.phone || 'NA').substring(0, 2).toUpperCase();
            const color = getColor(contact.name || contact.phone);
            return (
              <div
                key={contact.id || i}
                onClick={() => onSelectContact(contact)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                style={{
                  background: isActive ? '#f0f2f5' : 'transparent',
                  borderBottom: '1px solid #f0f2f5',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f5f6f6'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-base" style={{ background: color }}>
                  {initials}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium text-sm truncate" style={{ color: '#111b21' }}>
                      {contact.name || contact.phone}
                    </span>
                    {contact.timestamp && (
                      <span className="text-xs ml-2 flex-shrink-0" style={{ color: '#8696a0' }}>{contact.timestamp}</span>
                    )}
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: '#8696a0' }}>
                    {contact.lastMessage && contact.lastMessage !== 'No messages yet' ? contact.lastMessage : contact.phone}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isAdding && (
        <ContactForm
          onClose={() => setIsAdding(false)}
          onSuccess={() => {
            setIsAdding(false);
            onContactUpdated();
          }}
        />
      )}
    </div>
  );
}
