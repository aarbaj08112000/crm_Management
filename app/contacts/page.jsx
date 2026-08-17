"use client";

import React, { useState, useEffect } from 'react';
import { ClipboardList, MessageCircle, UserPlus, Loader2, MapPin, Globe, Mail, Phone, CalendarDays } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function ContactsPage() {
    const { showToast } = useApp();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // id of the contact being converted
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalContacts, setTotalContacts] = useState(0);

    useEffect(() => {
        fetchContacts(page);
    }, [page]);

    const fetchContacts = async (currentPage) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/contacts?page=${currentPage}&limit=50`);
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to fetch contacts');
            }
            setContacts(data.data);
            setTotalPages(data.totalPages || 1);
            setTotalContacts(data.total || 0);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsApp = (phone) => {
        if (!phone) return;
        // Clean phone number (remove +, spaces, dashes, etc.)
        const cleanedPhone = phone.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${cleanedPhone}`, '_blank');
    };

    const handleConvertToLead = async (id) => {
        setActionLoading(id);
        try {
            const response = await fetch('/api/contacts/convert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contactId: id })
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to convert contact');
            }
            // Update local state to remove or mark as lead
            setContacts(contacts.map(c => c.id === id ? { ...c, is_lead: 1 } : c));
            showToast('Successfully converted to lead!', 'success');
        } catch (err) {
            showToast(`Error: ${err.message}`, 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const markAsFake = async (id, isFake) => {
        try {
            const response = await fetch('/api/contacts/fake', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contactId: id, is_fake: isFake })
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to update status');
            }
            setContacts(contacts.map(c => c.id === id ? { ...c, is_fake: isFake ? 1 : 0 } : c));
            showToast(isFake ? 'Marked as fake contact' : 'Reverted to real contact', 'success');
        } catch (err) {
            showToast(`Error: ${err.message}`, 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <ClipboardList className="w-7 h-7 text-indigo-600" />
                            Campaign Contacts
                        </h1>
                        <p className="text-gray-500 mt-1">Manage AI-scraped leads and convert them into your main CRM pipeline.</p>
                    </div>
                    <div className="bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100 flex flex-col items-end">
                        <span className="text-indigo-700 font-semibold">{totalContacts} Total Contacts</span>
                        <span className="text-indigo-500 text-xs text-right">Page {page} of {totalPages}</span>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100">
                        {error}
                    </div>
                )}

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {contacts.length === 0 ? (
                        <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-gray-500">No contacts found. Use the AI Scraper to generate leads.</p>
                        </div>
                    ) : (
                        contacts.map((contact) => (
                            <div key={contact.id} className={`bg-white rounded-2xl border ${contact.is_lead ? 'border-green-200 bg-green-50/30' : 'border-gray-100'} p-5 shadow-sm hover:shadow-md transition-shadow`}>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2" title={contact.title}>
                                        {contact.title || 'Unnamed Contact'}
                                    </h3>
                                    {contact.is_lead === 1 && (
                                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md font-bold whitespace-nowrap ml-2">
                                            Converted
                                        </span>
                                    )}
                                </div>
                                
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span>{contact.phone || '-'}</span>
                                    </div>
                                    {contact.email && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                                            <span className="truncate" title={contact.email}>{contact.email}</span>
                                        </div>
                                    )}
                                    {contact.website && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                                            <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate" title={contact.website}>
                                                {contact.website.replace(/^https?:\/\//, '')}
                                            </a>
                                        </div>
                                    )}
                                    {contact.address && (
                                        <div className="flex items-start gap-2 text-sm text-gray-600">
                                            <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                            <span className="line-clamp-2" title={contact.address}>{contact.address}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-100">
                                        <CalendarDays className="w-3.5 h-3.5" />
                                        <span>Added: {new Date(contact.added_date).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-4">
                                    {!contact.is_fake ? (
                                        <>
                                            {contact.is_lead !== 1 && (
                                                <button 
                                                    onClick={() => markAsFake(contact.id, true)}
                                                    className="flex-1 flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-xl font-medium transition-colors text-sm"
                                                >
                                                    Fake Contact
                                                </button>
                                            )}
                                            
                                            <button 
                                                onClick={() => handleWhatsApp(contact.phone)}
                                                disabled={!contact.phone}
                                                className="flex-1 flex items-center justify-center gap-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-xl font-medium transition-colors text-sm"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                WhatsApp
                                            </button>
                                            
                                            <button
                                                onClick={() => handleConvertToLead(contact.id)}
                                                disabled={contact.is_lead === 1 || actionLoading === contact.id}
                                                className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 text-white py-2 rounded-xl font-medium transition-colors text-sm"
                                            >
                                                {actionLoading === contact.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : contact.is_lead === 1 ? (
                                                    'Converted'
                                                ) : (
                                                    <>
                                                        <UserPlus className="w-4 h-4" />
                                                        To Lead
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <div className="w-full flex items-center gap-2">
                                            <div className="flex-1 text-center text-sm font-medium text-red-500 bg-red-50 py-2 rounded-xl border border-red-100">
                                                Marked as Fake Contact
                                            </div>
                                            <button 
                                                onClick={() => markAsFake(contact.id, false)}
                                                className="flex-1 flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 py-2 rounded-xl font-medium transition-colors text-sm"
                                            >
                                                Revert to Real
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-8 py-4">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600 font-medium">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
