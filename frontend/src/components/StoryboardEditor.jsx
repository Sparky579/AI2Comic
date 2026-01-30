import React, { useState, useEffect } from 'react';

const StoryboardEditor = ({ storyboard, onGenerate, isLoading }) => {
    // Local editable state
    const [editableStoryboard, setEditableStoryboard] = useState(storyboard);

    // Sync if parent updates storyboard (e.g. re-generation) - rarely happens in this flow but good practice
    useEffect(() => {
        setEditableStoryboard(storyboard);
    }, [storyboard]);

    const updatePanel = (pageIndex, panelIndex, field, value) => {
        const newStoryboard = { ...editableStoryboard };
        newStoryboard.pages[pageIndex].panels[panelIndex][field] = value;
        setEditableStoryboard(newStoryboard);
    };

    const handleGenerateClick = () => {
        onGenerate(editableStoryboard);
    };

    return (
        <div className="storyboard-editor">
            <div className="step-header">
                <h2>Step 1: Storyboard Editor</h2>
                <button className="primary" onClick={handleGenerateClick} disabled={isLoading}>
                    {isLoading ? 'Generating Images...' : 'Generate Manga Images'}
                </button>
            </div>

            <div className="storyboard-meta">
                <h3>{editableStoryboard.title}</h3>
                <p>Total Pages: {editableStoryboard.total_pages}</p>
            </div>

            {editableStoryboard.pages.map((page, pageIndex) => (
                <div key={page.page_number} className="page-section">
                    <h4>Page {page.page_number}</h4>
                    <p className="layout-desc">Layout: {page.layout_description}</p>

                    <div className="panels-list">
                        {page.panels.map((panel, panelIndex) => (
                            <div key={panel.panel_number} className="panel-edit-item expanded">
                                <div className="panel-header">
                                    <strong>Panel {panel.panel_number}</strong>
                                </div>

                                <div className="form-group">
                                    <label>Visual Description</label>
                                    <textarea
                                        value={panel.description}
                                        onChange={(e) => updatePanel(pageIndex, panelIndex, 'description', e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group half">
                                        <label>Dialogue</label>
                                        <input
                                            type="text"
                                            value={panel.dialogue || ''}
                                            onChange={(e) => updatePanel(pageIndex, panelIndex, 'dialogue', e.target.value)}
                                            placeholder="Dialogue"
                                        />
                                    </div>
                                    <div className="form-group half">
                                        <label>Shot Type</label>
                                        <input
                                            type="text"
                                            value={panel.shot_type || ''}
                                            onChange={(e) => updatePanel(pageIndex, panelIndex, 'shot_type', e.target.value)}
                                            placeholder="Shot Type"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StoryboardEditor;
