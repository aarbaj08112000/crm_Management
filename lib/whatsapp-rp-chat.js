/**
 * lib/whatsapp-rp-chat.js
 * Handles session-based authentication and all chat API calls
 * to the RP Digital WhatsApp platform (whatsapp.rpdigitalphone.com)
 */

const RP_CHAT_BASE = 'https://whatsapp.rpdigitalphone.com/index.php';
const RP_EMAIL    = process.env.RP_CHAT_EMAIL    || 'aarbaj10@yopmail.com';
const RP_PASSWORD = process.env.RP_CHAT_PASSWORD || 'Test@123';

import { cookies } from 'next/headers';

let _sessionCookie = null;
let _sessionExpiry = 0; // ms timestamp

/**
 * Login to RP Chat and cache the ci_session cookie for 90 minutes.
 */
export async function rpGetSession() {
  const now = Date.now();

  // 1. Prefer cookie set by the user in the browser (via UI)
  try {
    const cookieStore = cookies();
    const custom = cookieStore.get('rp_cookie');
    if (custom && custom.value) {
      const decoded = decodeURIComponent(custom.value);
      const match = decoded.match(/ci_session=[^\s;,"]+/);
      if (match) {
        _sessionCookie = match[0];
        _sessionExpiry = Date.now() + 90 * 60 * 1000;
        return decoded;
      }
    }
  } catch (e) {
    // Ignore error if used outside request context
  }

  // 2. Fallback to manually-set session cookie from .env

  const envCookie = process.env.RP_DIGITAL_COOKIE;
  if (envCookie) {
    // Extract just the ci_session portion if multiple cookies are present
    const match = envCookie.match(/ci_session=[^\s;,"]+/);
    if (match) {
      // Use the env cookie — it should be refreshed when expired by updating .env
      _sessionCookie = match[0];
      _sessionExpiry = Date.now() + 90 * 60 * 1000;
      return envCookie; // Return the full cookie string (may include fblo_ etc.)
    }
  }

  // 2. Fallback: cached programmatic login session
  if (_sessionCookie && now < _sessionExpiry) {
    return _sessionCookie;
  }

  // 3. Re-login programmatically
  const initRes = await fetch(`${RP_CHAT_BASE}/agent_auth/login`, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
    redirect: 'follow',
  });
  const initCookie = (initRes.headers.get('set-cookie') || '').match(/ci_session=[^;]+/)?.[0] || '';

  const loginRes = await fetch(`${RP_CHAT_BASE}/agent_auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'text/html,*/*',
      'Referer': `${RP_CHAT_BASE}/agent_auth/login`,
      'Cookie': initCookie,
    },
    body: new URLSearchParams({ email: RP_EMAIL, password: RP_PASSWORD }),
    redirect: 'manual',
  });

  if (loginRes.status === 303 || loginRes.status === 302 || loginRes.ok) {
    _sessionCookie = initCookie;
    _sessionExpiry = Date.now() + 90 * 60 * 1000;
    return _sessionCookie;
  }

  throw new Error(`RP Chat login failed: Status ${loginRes.status}`);
}

/**
 * Parse SSE (Server-Sent Events) text and return the data of the first
 * event matching the given event name.
 * @param {string} text  Raw SSE response body
 * @param {string} eventName  e.g. 'newMessages'
 * @returns {any|null} Parsed JSON data or null
 */
function parseSSEEvent(text, eventName) {
  const lines = text.split('\n');
  let currentEvent = null;
  let currentData = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('event:')) {
      currentEvent = trimmed.replace('event:', '').trim();
      currentData = null;
    } else if (trimmed.startsWith('data:')) {
      currentData = trimmed.replace('data:', '').trim();
    } else if (trimmed === '' && currentEvent === eventName && currentData) {
      try {
        return JSON.parse(currentData);
      } catch {
        // continue looking
      }
    }
  }

  // Fallback: check if remaining data matches
  if (currentEvent === eventName && currentData) {
    try { return JSON.parse(currentData); } catch {}
  }

  return null;
}

/**
 * Make an authenticated GET request to RP Chat (JSON response)
 */
async function rpGet(path, params = {}) {
  const cookie = await rpGetSession();
  const url = new URL(`${RP_CHAT_BASE}/${path}`);
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== null && url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      'Cookie': cookie,
      'User-Agent': 'Mozilla/5.0',
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json',
    },
  });

  if (res.status === 307 || res.status === 302 || res.status === 303) {
    _sessionCookie = null;
    _sessionExpiry = 0;
    return rpGet(path, params);
  }

  return res.json();
}

/**
 * Make an authenticated GET request to an SSE endpoint,
 * read the full response text, parse SSE events, and return the data
 * from the first `newMessages` event.
 */
async function rpGetSSE(path, params = {}) {
  const cookie = await rpGetSession();
  const url = new URL(`${RP_CHAT_BASE}/${path}`);
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== null && url.searchParams.set(k, v));

  const controller = new AbortController();
  // Timeout after 8 seconds to avoid hanging
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'text/event-stream',
        'Referer': `${RP_CHAT_BASE}/chat_messages/chat`,
      },
      signal: controller.signal,
    });

    if (res.status === 307 || res.status === 302 || res.status === 303) {
      _sessionCookie = null;
      _sessionExpiry = 0;
      return null;
    }

    // Read the SSE stream text — collect chunks until we find newMessages event
    const reader = res.body?.getReader();
    if (!reader) return null;

    let fullText = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += new TextDecoder().decode(value);
      // Stop reading once we have the newMessages event parsed
      const parsed = parseSSEEvent(fullText, 'newMessages');
      if (parsed) {
        reader.cancel();
        return parsed;
      }
    }

    return parseSSEEvent(fullText, 'newMessages');
  } catch (err) {
    if (err.name === 'AbortError') return null;
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Make an authenticated POST (form-encoded) request to RP Chat
 */
async function rpPost(path, body = {}) {
  const cookie = await rpGetSession();

  const res = await fetch(`${RP_CHAT_BASE}/${path}`, {
    method: 'POST',
    headers: {
      'Cookie': cookie,
      'User-Agent': 'Mozilla/5.0',
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  });

  if (res.status === 307 || res.status === 302 || res.status === 303) {
    _sessionCookie = null;
    _sessionExpiry = 0;
    return rpPost(path, body);
  }

  return res.json();
}

/**
 * Make an authenticated POST (multipart/FormData) request to RP Chat
 */
async function rpPostFormData(path, formData) {
  const cookie = await rpGetSession();

  const res = await fetch(`${RP_CHAT_BASE}/${path}`, {
    method: 'POST',
    headers: {
      'Cookie': cookie,
      'User-Agent': 'Mozilla/5.0',
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json',
    },
    body: formData,
  });

  if (res.status === 307 || res.status === 302 || res.status === 303) {
    _sessionCookie = null;
    _sessionExpiry = 0;
    return rpPostFormData(path, formData);
  }

  return res.json();
}

// ─── Public API helpers ────────────────────────────────────────────────────────

/**
 * Get conversation/contact list
 * @param {number} page
 * @param {'active'|'closed'|'all'|''} status
 */
export async function rpGetConversations(page = 1, status = '') {
  const cookie = await rpGetSession();

  // The RP API for `get_agent_chat_history` is buggy and drops active chats.
  // However, their main chat page embeds the full active/closed list in a hidden div.
  // We fetch the HTML and parse their embedded print_r output.
  const res = await fetch(`${RP_CHAT_BASE}/chat_messages/chat`, {
    headers: {
      'Cookie': cookie,
      'User-Agent': 'Mozilla/5.0',
    },
  });

  if (res.status === 307 || res.status === 302 || res.status === 303) {
    _sessionCookie = null;
    _sessionExpiry = 0;
    return rpGetConversations(page, status);
  }

  const html = await res.text();
  
  const regex = /Conversation \d+: stdClass Object\s*\(\s*([\s\S]*?)\n\)/g;
  let match;
  const conversations = [];
  while((match = regex.exec(html)) !== null) {
    const fields = match[1].split('\n');
    const obj = {};
    for(const line of fields) {
      const m = line.match(/^\s*\[(.*?)\]\s*=>\s*(.*)$/);
      if(m) obj[m[1]] = m[2].trim();
    }
    // Convert to similar structure as API
    if (obj.phone_number) {
      conversations.push(obj);
    }
  }

  // Fallback to API if HTML parsing fails entirely for some reason
  if (conversations.length === 0 && !html.includes('Active Conversations Count')) {
    return rpGet('chat_messages/get_agent_chat_history', { page, status });
  }

  // Sort by last_activity descending
  conversations.sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime());

  return {
    success: true,
    conversations,
    pagination: {
      current_page: 1,
      total_pages: 1,
      total_conversations: conversations.length,
      limit: 1000,
      status_filter: "all"
    }
  };
}

/**
 * Get messages for a phone number (initial load)
 * @param {string} phone  e.g. "918485835691"
 */
export async function rpGetMessages(phone, page = 1) {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (!cleanPhone) return { success: true, messages: [] };
  const encoded = encodeURIComponent(cleanPhone);

  // 1. Try SSE endpoint (last_updated=0 returns full conversation history)
  try {
    const result = await rpGetSSE(`chat_messages/chat_get_messages_by_time/${encoded}`, { last_updated: '0' });
    if (result && result.success && Array.isArray(result.messages) && result.messages.length > 0) return result;
  } catch (err) {
    console.error('rpGetMessages SSE error:', err);
  }

  // 2. Try full conversation history endpoint
  try {
    const history = await rpGet(`chat_messages/get_conversation_history/${encoded}`, { page: 1, limit: 200 });
    if (history && history.success && Array.isArray(history.messages) && history.messages.length > 0) return history;
  } catch (err) {
    console.error('rpGetMessages history error:', err);
  }

  // 3. Fallback to initial endpoint which returns JSON
  try {
    const initial = await rpGet(`chat_messages/chat_get_messages_initial/${encoded}`, { page });
    if (initial && initial.success && Array.isArray(initial.messages) && initial.messages.length > 0) return initial;
  } catch (err) {
    console.error('rpGetMessages initial error:', err);
  }

  return { success: true, messages: [] };
}

/**
 * Get only NEW messages since a given timestamp (for polling)
 * @param {string} phone  e.g. "918485835691"
 * @param {string} lastUpdated  datetime string e.g. "2026-10-10 17:30:00"
 */
export async function rpGetMessagesByTime(phone, lastUpdated) {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (!cleanPhone) return { success: true, messages: [] };
  const encoded = encodeURIComponent(cleanPhone);

  try {
    // chat_get_messages_by_time returns SSE events — use SSE parser
    const result = await rpGetSSE(`chat_messages/chat_get_messages_by_time/${encoded}`, { last_updated: lastUpdated });
    if (result && result.success) return result;
  } catch (err) {
    console.error('rpGetMessagesByTime error:', err);
  }
  return { success: true, messages: [] }; // Empty if no new messages
}

/**
 * Proxy-stream a media file by message ID (requires session cookie)
 * Returns a Response object with the binary content
 * @param {string|number} messageId
 */
export async function rpServeMedia(messageId) {
  const cookie = await rpGetSession();
  const res = await fetch(`${RP_CHAT_BASE}/chat_messages/serve_media/${messageId}`, {
    headers: {
      'Cookie': cookie,
      'User-Agent': 'Mozilla/5.0',
    },
  });
  return res;
}

/**
 * Send a text message
 * @param {string} toNumber
 * @param {string} message
 */
export async function rpSendMessage(toNumber, message) {
  return rpPost('chat_messages/chat_send_message', { to_number: toNumber, message });
}

/**
 * Upload and send a media file
 * @param {FormData} formData  Must contain the file field
 */
export async function rpUploadMedia(formData) {
  return rpPostFormData('chat_messages/upload_media', formData);
}

/**
 * Mark a conversation as read
 * @param {string} phoneNumber
 */
export async function rpMarkRead(phoneNumber) {
  return rpPost('chat_messages/mark_conversation_read', { phone_number: phoneNumber });
}

/**
 * Update chat status (open/close)
 * @param {string} phoneNumber
 * @param {string} status  e.g. 'Active', 'Closed'
 */
export async function rpUpdateStatus(phoneNumber, status) {
  return rpPost('chat_messages/update_chat_status', { phone_number: phoneNumber, status });
}

/**
 * Get predefined quick reply texts
 */
export async function rpGetPredefinedTexts() {
  return rpGet('chat_messages/get_predefined_texts');
}

/**
 * Get list of agents
 */
export async function rpGetAgents() {
  return rpGet('chat_messages/get_agents_list');
}
