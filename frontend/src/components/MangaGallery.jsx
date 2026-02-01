import React, { useState } from 'react';

const MangaGallery = ({ pages, onPageRegenerate, isLoading, onDownloadAll }) => {
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [editedPrompt, setEditedPrompt] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [extraRefImage, setExtraRefImage] = useState(null);
    const [usePrevAsRef, setUsePrevAsRef] = useState(false);

    const currentPage = pages[currentPageIndex];

    const handleNext = () => {
        if (currentPageIndex < pages.length - 1) {
            setCurrentPageIndex(prev => prev + 1);
            setIsEditing(false);
            setExtraRefImage(null);
            setUsePrevAsRef(false);
        }
    };

    const handlePrev = () => {
        if (currentPageIndex > 0) {
            setCurrentPageIndex(prev => prev - 1);
            setIsEditing(false);
            setExtraRefImage(null);
            setUsePrevAsRef(false);
        }
    };

    const handleEditClick = () => {
        setEditedPrompt(currentPage.editablePrompt || '');
        setIsEditing(true);
    };

    const handleRefImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setExtraRefImage(reader.result.replace('data:', '').replace(/^.+,/, ''));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRegenerate = () => {
        onPageRegenerate(currentPage.page_number, editedPrompt || currentPage.editablePrompt, extraRefImage, usePrevAsRef);
        // Keep editing mode open for iterative refinement
    };

    return (
        <div className="manga-gallery-album">
            <div className="gallery-header">
                <h2>Generated Manga</h2>
                <div className="gallery-controls">
                    <button onClick={onDownloadAll} className="download-btn">
                        📥 Download All
                    </button>
                    <div className="pagination-controls">
                        <button onClick={handlePrev} disabled={currentPageIndex === 0 || isLoading}>
                            &lt; Prev
                        </button>
                        <span>Page {currentPageIndex + 1} of {pages.length}</span>
                        <button onClick={handleNext} disabled={currentPageIndex === pages.length - 1 || isLoading}>
                            Next &gt;
                        </button>
                    </div>
                </div>
            </div>

            <div className="gallery-viewport">
                {currentPage && (
                    <div className="page-display">
                        {currentPage.status === 'pending' ? (
                            <div className="loading-placeholder">
                                <div className="spinner"></div>
                                <p>Generating Page {currentPage.page_number}...</p>
                            </div>
                        ) : currentPage.imageUrl ? (
                            <div className="page-image-container">
                                <img src={`data:image/png;base64,${currentPage.imageUrl}`} alt={`Page ${currentPage.page_number}`} />
                            </div>
                        ) : (
                            <div className="error-placeholder">
                                <p>Failed to generate. Try regenerating.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="page-actions-bar">
                {!isEditing ? (
                    <button onClick={handleEditClick} disabled={isLoading} className="secondary">
                        Edit & Regenerate
                    </button>
                ) : (
                    <div className="edit-prompt-area">
                        <label>Edit Prompt for Page {currentPage.page_number}:</label>
                        <textarea
                            value={editedPrompt}
                            onChange={(e) => setEditedPrompt(e.target.value)}
                            rows={5}
                            style={{ width: '100%', marginBottom: '0.5rem' }}
                        />

                        <div className="option-row">
                            <label>
                                <input type="checkbox" checked={usePrevAsRef} onChange={(e) => setUsePrevAsRef(e.target.checked)} />
                                Use current image as reference (img2img)
                            </label>
                        </div>

                        <div className="option-row">
                            <label>Or upload extra reference image:</label>
                            <input type="file" accept="image/*" onChange={handleRefImageUpload} />
                            {extraRefImage && (
                                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '0.9rem' }}>Uploaded:</span>
                                    <img src={`data:image/png;base64,${extraRefImage}`} alt="Ref" style={{ height: '40px', border: '1px solid #ccc' }} />
                                    <button
                                        onClick={() => setExtraRefImage(null)}
                                        style={{ background: '#ff4444', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '0.5rem' }}>
                            <button onClick={() => setIsEditing(false)} className="secondary" style={{ marginRight: '0.5rem' }}>
                                Cancel
                            </button>
                            <button onClick={handleRegenerate} disabled={isLoading} className="primary">
                                Regenerate Page
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MangaGallery;
