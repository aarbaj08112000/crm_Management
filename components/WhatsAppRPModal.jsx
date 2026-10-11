'use client';

import { useState, useEffect } from 'react';
import { X, MessageSquare, Send, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * WhatsAppRPModal
 * Opens from the Enquiry List action menu.
 * - If not yet linked: shows template selection popup → sends → stores the link record
 * - Once sent: provides a direct "Open Chat" button that navigates to /whatsapp-rp?phone=...&name=...
 */
export default function WhatsAppRPModal({ enquiry, currentUser, onClose, onSent }) {
  const router = useRouter();
  const [step, setStep] = useState('loading'); // loading | send_template | already_sent
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [error, setError] = useState('');
  const [linkRecord, setLinkRecord] = useState(null);

  // Phone from enquiry — strip any non-digit prefix issues
  const rawPhone = (enquiry?.mobile_number || enquiry?.whatsapp_number || '').replace(/\D/g, '');
  const phone = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;
  const contactName = enquiry?.name || phone;

  // 1. On mount: check if this lead is already linked
  useEffect(() => {
    async function checkLink() {
      try {
        const res = await fetch(`/api/whatsapp-rp/lead-link?lead_id=${enquiry.enquiry_id}`);
        const data = await res.json();
        if (data.linked) {
          setLinkRecord(data.record);
          setStep('already_sent');
        } else {
          setStep('send_template');
          fetchTemplates();
        }
      } catch {
        setStep('send_template');
        fetchTemplates();
      }
    }
    checkLink();
  }, [enquiry.enquiry_id]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/whatsapp-rp/get_templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data?.templates || []);
        if (data.data?.templates?.length > 0) {
          setSelectedTemplate(data.data.templates[0].name);
        }
      }
    } catch (err) {
      setError('Failed to load templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSendTemplate = async () => {
    if (!selectedTemplate || !phone) return;
    setSending(true);
    setError('');
    try {
      // 1. Send template via RP API
      const res = await fetch('/api/whatsapp-rp/send_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numbers: phone, template_id: selectedTemplate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send template');
        return;
      }

      // 2. Save lead-link record
      await fetch('/api/whatsapp-rp/lead-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: enquiry.enquiry_id,
          mobile_number: phone,
          contact_name: contactName,
          template_name: selectedTemplate,
          sent_by_user_id: currentUser?.id || null,
          sent_by_username: currentUser?.name || currentUser?.username || null,
        }),
      });

      setStep('already_sent');
      setLinkRecord({ mobile_number: phone, contact_name: contactName, template_name: selectedTemplate });
      if (onSent) onSent();
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleOpenChat = () => {
    const targetPhone = linkRecord?.mobile_number || phone;
    const targetName = encodeURIComponent(linkRecord?.contact_name || contactName);
    router.push(`/whatsapp-rp?phone=${targetPhone}&name=${targetName}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">WhatsApp RP</h2>
              <p className="text-emerald-100 text-xs">{contactName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition p-1.5 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Loading */}
          {step === 'loading' && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          )}

          {/* Send Template Step */}
          {step === 'send_template' && (
            <div className="space-y-5">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/40">
                <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">
                  📱 Sending to: <span className="font-bold">+{phone}</span>
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  Select a template to start a WhatsApp RP conversation with this lead.
                </p>
              </div>

              {loadingTemplates ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  <span className="ml-2 text-sm text-slate-500">Loading templates...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Select Template
                  </label>
                  <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                    {templates.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">No templates available</p>
                    ) : (
                      templates.map(t => (
                        <label
                          key={t.name}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            selectedTemplate === t.name
                              ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-600'
                              : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'
                          }`}
                        >
                          <input
                            type="radio"
                            name="template"
                            value={t.name}
                            checked={selectedTemplate === t.name}
                            onChange={() => setSelectedTemplate(t.name)}
                            className="mt-0.5 accent-emerald-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">
                              {t.name.replace(/_/g, ' ')}
                            </p>
                            {t.language && (
                              <span className="text-[10px] text-slate-400 uppercase">{t.language}</span>
                            )}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-lg border border-rose-100">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendTemplate}
                  disabled={!selectedTemplate || sending || loadingTemplates}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 transition"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Sending...' : 'Send Template'}
                </button>
              </div>
            </div>
          )}

          {/* Already Sent Step */}
          {step === 'already_sent' && (
            <div className="space-y-5 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Template Already Sent</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  A WhatsApp RP conversation exists for this lead.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{linkRecord?.contact_name || contactName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">+{linkRecord?.mobile_number || phone}</span>
                </div>
                {linkRecord?.template_name && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Template:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{linkRecord.template_name.replace(/_/g, ' ')}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Close
                </button>
                <button
                  onClick={handleOpenChat}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
