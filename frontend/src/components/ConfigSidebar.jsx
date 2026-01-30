import React, { useState } from 'react';

const ConfigSidebar = ({ config, onConfigChange, isLoading, apiKey, onApiKeyChange, isConfigured }) => {
    const [localApiKey, setLocalApiKey] = useState(apiKey || '');
    const [isSaving, setIsSaving] = useState(false);

    const updateConfig = (key, value) => {
        onConfigChange({ ...config, [key]: value });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result.replace('data:', '').replace(/^.+,/, '');
                updateConfig('styleImage', base64String);
                updateConfig('styleImagePreview', reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleApiKeySave = async () => {
        if (!localApiKey.trim()) return;
        setIsSaving(true);
        try {
            await onApiKeyChange(localApiKey);
        } catch (e) {
            alert("Failed to save API key");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <aside className="config-sidebar">
            <h2 className="title-small">Configuration</h2>

            {/* API Key Section */}
            <div className="form-group api-key-section">
                <label>Google API Key</label>
                <div className="api-key-input">
                    <input
                        type="password"
                        value={localApiKey}
                        onChange={(e) => setLocalApiKey(e.target.value)}
                        placeholder="AIza..."
                    />
                    <button
                        onClick={handleApiKeySave}
                        disabled={isSaving || !localApiKey.trim()}
                        className={isConfigured ? 'configured' : 'not-configured'}
                    >
                        {isSaving ? '...' : isConfigured ? '✓' : 'Save'}
                    </button>
                </div>
                <small className={isConfigured ? 'status-ok' : 'status-warn'}>
                    {isConfigured ? 'API Key configured' : 'API Key not set'}
                </small>
            </div>

            <hr className="divider" />

            <div className="form-group">
                <label>Art Style Description</label>
                <textarea
                    value={config.styleText || ''}
                    onChange={(e) => updateConfig('styleText', e.target.value)}
                    placeholder="e.g. Japanese Manga, Detailed Black and White"
                    rows={3}
                />
            </div>

            <div className="form-group">
                <label>Style Reference Image</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                {config.styleImagePreview && (
                    <div className="image-preview">
                        <img src={config.styleImagePreview} alt="Style Ref" />
                        <button onClick={() => {
                            updateConfig('styleImage', null);
                            updateConfig('styleImagePreview', null);
                        }} className="remove-btn">×</button>
                    </div>
                )}
            </div>

            <div className="form-group">
                <label>Extra Prompts (Global)</label>
                <textarea
                    value={config.extraPrompt || ''}
                    onChange={(e) => updateConfig('extraPrompt', e.target.value)}
                    placeholder="e.g. dark atmosphere, high contrast"
                    rows={2}
                />
            </div>

            <div className="form-group">
                <label>Aspect Ratio</label>
                <select value={config.aspectRatio || '16:9'} onChange={(e) => updateConfig('aspectRatio', e.target.value)}>
                    <option value="16:9">16:9 (Cinematic)</option>
                    <option value="4:3">4:3 (Standard)</option>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="9:16">9:16 (Vertical)</option>
                </select>
            </div>

            <div className="form-group">
                <label>Resolution</label>
                <select value={config.imageSize || '1K'} onChange={(e) => updateConfig('imageSize', e.target.value)}>
                    <option value="1K">1K (Standard)</option>
                    <option value="2K">2K (High)</option>
                    <option value="4K">4K (Ultra)</option>
                </select>
            </div>

            <div className="info-box">
                <p><small>Settings are saved locally.</small></p>
            </div>
        </aside>
    );
};

export default ConfigSidebar;
