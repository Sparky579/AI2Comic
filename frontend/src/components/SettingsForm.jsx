import React, { useState } from 'react';

const SettingsForm = ({ onSubmit, isLoading }) => {
    const [prompt, setPrompt] = useState('');
    const [style, setStyle] = useState('Japanese Manga, Detailed Black and White');
    const [aspectRatio, setAspectRatio] = useState('16:9');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ prompt, style, aspectRatio });
    };

    return (
        <div className="step-card">
            <h2>Step 0: Concept & Settings</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Story Prompt</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="A cyberpunk detective solves a mystery in Neo-Tokyo..."
                        required
                        className="storyboard-input"
                    />
                </div>

                <div className="form-group">
                    <label>Art Style</label>
                    <input
                        type="text"
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        placeholder="e.g. Watercolor, Ghibli style, Noir"
                    />
                </div>

                <div className="form-group">
                    <label>Aspect Ratio</label>
                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                        <option value="16:9">16:9 (Cinematic)</option>
                        <option value="4:3">4:3 (Standard)</option>
                        <option value="1:1">1:1 (Square)</option>
                        <option value="9:16">9:16 (Vertical)</option>
                    </select>
                </div>

                <button type="submit" className="primary" disabled={isLoading}>
                    {isLoading ? 'Generating Storyboard...' : 'Create Storyboard'}
                </button>
            </form>
        </div>
    );
};

export default SettingsForm;
