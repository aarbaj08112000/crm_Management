const RP_API_BASE_URL = 'https://whatsapp.rpdigitalphone.com/index.php/apis';

/**
 * Helper to get the authenticated headers for RP Digital API
 */
function getHeaders() {
  const token = process.env.RP_DIGITAL_WHATSAPP_TOKEN;
  if (!token) {
    console.warn('RP_DIGITAL_WHATSAPP_TOKEN is not defined in environment variables');
  }
  return {
    'Content-Type': 'application/json',
    'X-API-TOKEN': token || '',
  };
}

/**
 * Sends a WhatsApp Template Message via RP Digital
 * @param {Object} payload 
 * @param {string|string[]|Object[]} payload.numbers - Recipient numbers
 * @param {number|string} payload.template_id - Template ID or name
 * @param {string[]|Object} [payload.template_variables] - Dynamic variables
 * @param {string} [payload.media_url] - Media URL
 * @param {string} [payload.media_filename] - Media Filename
 * @returns {Promise<Object>} The API response
 */
export async function sendMessage(payload) {
  try {
    const response = await fetch(`${RP_API_BASE_URL}/send_message`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('RP Digital Send Message Error:', data);
      return { success: false, status: response.status, ...data };
    }
    return data;
  } catch (error) {
    console.error('Exception in lib/whatsapp-rp.sendMessage:', error);
    throw error;
  }
}

/**
 * Retrieves Approved WhatsApp Templates from RP Digital
 * @returns {Promise<Object>} The API response
 */
export async function getTemplates() {
  try {
    const response = await fetch(`${RP_API_BASE_URL}/get_templates`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('RP Digital Get Templates Error:', data);
      return { success: false, status: response.status, ...data };
    }
    return data;
  } catch (error) {
    console.error('Exception in lib/whatsapp-rp.getTemplates:', error);
    throw error;
  }
}

/**
 * Sends a normal text message via the internal RP Digital UI endpoint.
 * Requires RP_DIGITAL_COOKIE in environment variables.
 * @param {Object} payload 
 * @param {string|number} payload.numbers - Recipient number
 * @param {string} payload.message - Text message content
 * @returns {Promise<Object>} The API response
 */
export async function sendTextMessage(payload) {
  try {
    const response = await fetch('http://localhost:3001/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || data.success === false) {
      console.error('Local WhatsApp Server Error:', data);
      return { success: false, status: response.status, ...data };
    }
    return data;
  } catch (error) {
    console.error('Exception in lib/whatsapp-rp.sendTextMessage:', error);
    // If connection refused, it means the server isn't running
    if (error.code === 'ECONNREFUSED') {
       return { success: false, error: 'Local WhatsApp server is not running on port 3001.' };
    }
    throw error;
  }
}
