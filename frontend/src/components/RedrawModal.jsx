import React, { useState } from 'react';

const RedrawModal = ({ panel, onClose, onConfirm, isLoading }) => {
    const [prompt, setPrompt] = useState(panel.description || "");
    const [useReference, setUseReference] = useState(true);

    if (!panel) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(panel.panel_id, prompt, useReference);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3>Redraw Panel {panel.panel_number}</h3>

                <div className="preview">
                    <img
                        src={`data:image/png;base64,${panel.image}`}
                        alt="Current"
                        style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }}
                    />
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Refined Prompt</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="storyboard-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={useReference}
                                onChange={(e) => setUseReference(e.target.checked)}
                            />
                            Use current image as reference (Img2Img)
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit" className="primary" disabled={isLoading}>
                            {isLoading ? 'Redrawing...' : 'Redraw'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RedrawModal;
