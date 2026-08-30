"use client";

import React, { useState } from 'react';
import { Bot, Play, Loader2, Download, Table, FileSpreadsheet, Copy, Check } from 'lucide-react';

export default function ScrapePage() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [inputParams, setInputParams] = useState(
        '{\n  "searchStringsArray": [\n    "industrial manufacturing companies in Pune",\n    "manufacturing plants in Pune"\n  ],\n  "maxCrawledPlacesPerSearch": 20,\n  "language": "en",\n  "countryCode": "in",\n  "pageLength": 1\n}'
    );
    const [copied, setCopied] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [generateMessage, setGenerateMessage] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [contactTag, setContactTag] = useState('');

    React.useEffect(() => {
        fetch('/api/users')
            .then(res => res.json())
            .then(data => {
                setUsers(Array.isArray(data) ? data : (data.users || []));
            })
            .catch(console.error);
    }, []);

    const handleScrape = async () => {
        setLoading(true);
        setError('');
        setResults(null);
        
        let parsedInput = {};
        try {
            parsedInput = JSON.parse(inputParams);
        } catch (e) {
            setError('Invalid JSON input parameters.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input: parsedInput }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to run scraper');
            }

            setResults(data.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (results) {
            navigator.clipboard.writeText(JSON.stringify(results, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleGenerateContacts = async () => {
        if (!results || results.length === 0) return;
        setGenerating(true);
        setGenerateMessage('');
        try {
            const response = await fetch('/api/contacts/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ results, assignedTo: selectedUser, tag: contactTag })
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to generate contacts');
            }
            setGenerateMessage(`Successfully generated ${data.insertedCount} new contacts!`);
        } catch (err) {
            setGenerateMessage(`Error: ${err.message}`);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Bot className="w-8 h-8 text-blue-600" />
                            AI Lead Scraper
                        </h1>
                        <p className="text-gray-500 mt-2">Configure and run your Apify automation task.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Controls Section */}
                    <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Configuration</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Input Parameters (JSON)
                                </label>
                                <textarea
                                    value={inputParams}
                                    onChange={(e) => setInputParams(e.target.value)}
                                    className="w-full h-48 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none"
                                    placeholder='{"keyword": "marketing agencies"}'
                                />
                            </div>

                            <button
                                onClick={handleScrape}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Running Scraper...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-5 h-5" />
                                        Start Scraping
                                    </>
                                )}
                            </button>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                <Table className="w-5 h-5 text-gray-500" />
                                Results Output
                            </h2>
                            <div className="flex items-center gap-3">
                                {results && (
                                    <>
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                            {results.length} items found
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={contactTag}
                                                onChange={(e) => setContactTag(e.target.value)}
                                                placeholder="Tag (e.g. Inventory)"
                                                className="border border-gray-300 rounded-lg px-3 py-2 w-40 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            />
                                            <select 
                                                value={selectedUser} 
                                                onChange={(e) => setSelectedUser(e.target.value)}
                                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            >
                                                <option value="">-- Assign to --</option>
                                                {users.map(u => (
                                                    <option key={u.user_id} value={u.user_id}>{u.user_name || u.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button 
                                            onClick={handleGenerateContacts}
                                            disabled={generating || !selectedUser}
                                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-70"
                                        >
                                            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                                            Generate Contacts
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {generateMessage && (
                            <div className={`p-4 mb-4 rounded-xl text-sm border ${generateMessage.includes('Error') ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                                {generateMessage}
                            </div>
                        )}

                        {!results && !loading && (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                <FileSpreadsheet className="w-16 h-16 mb-4 opacity-20" />
                                <p>No results yet. Start a scrape to see data here.</p>
                            </div>
                        )}

                        {loading && (
                            <div className="flex flex-col items-center justify-center h-64 text-blue-500">
                                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                                <p className="text-gray-500 font-medium animate-pulse">Extracting leads from Apify...</p>
                            </div>
                        )}

                        {results && results.length > 0 && (
                            <div className="relative overflow-x-auto rounded-xl border border-gray-200">
                                <button
                                    onClick={handleCopy}
                                    className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors z-10"
                                    title="Copy output"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <pre className="p-4 pt-12 text-sm text-gray-700 bg-gray-50 font-mono">
                                    {JSON.stringify(results, null, 2)}
                                </pre>
                            </div>
                        )}

                        {results && results.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                <p>Scrape completed but no items were returned.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
