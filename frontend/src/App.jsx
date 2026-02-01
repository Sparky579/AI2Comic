import React, { useState, useEffect } from 'react';
import ConfigSidebar from './components/ConfigSidebar';
import StoryboardEditor from './components/StoryboardEditor';
import MangaGallery from './components/MangaGallery';
import { generateStoryboardStream, generatePagesBatch, generatePageStream, checkConfigStatus, setApiKey } from './api';
import './index.css';

const STORAGE_KEY = 'ai-manga-gen-config';

// Load config from localStorage
const loadSavedConfig = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Don't restore styleImage (too large), only other settings
      return {
        styleText: parsed.styleText || '',
        extraPrompt: parsed.extraPrompt || '',
        aspectRatio: parsed.aspectRatio || '9:16',
        imageSize: parsed.imageSize || '2K',
        styleImage: null,
        styleImagePreview: null
      };
    }
  } catch (e) {
    console.error("Failed to load saved config", e);
  }
  return null;
};

// Save config to localStorage
const saveConfig = (config) => {
  try {
    // Don't save large image data
    const toSave = {
      styleText: config.styleText,
      extraPrompt: config.extraPrompt,
      aspectRatio: config.aspectRatio,
      imageSize: config.imageSize
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error("Failed to save config", e);
  }
};

// Thinking stream display with separate sections
const ThinkingStream = ({ thinkingContent, textContent, isThinking }) => (
  <div className="thinking-stream">
    {thinkingContent && (
      <>
        <div className="thinking-header">
          <span className="thinking-icon">🧠</span>
          <span>Gemini 思考中... (Thinking Summary)</span>
        </div>
        <div className="thinking-content thinking-section">
          <pre>{thinkingContent}</pre>
        </div>
      </>
    )}
    {textContent && (
      <>
        <div className="thinking-header text-header">
          <span className="thinking-icon">✍️</span>
          <span>生成内容...</span>
        </div>
        <div className="thinking-content text-section">
          <pre>{textContent}</pre>
        </div>
      </>
    )}
    {isThinking && !thinkingContent && !textContent && (
      <div className="thinking-header">
        <span className="thinking-icon">⏳</span>
        <span>连接中...</span>
      </div>
    )}
  </div>
);

const buildPagePrompt = (page, styleReference) => {
  let prompt = `Layout: ${page.layout_description || 'Standard'}\nArt Style: ${styleReference}\nPanels:\n`;
  page.panels.forEach(panel => {
    prompt += `- Panel ${panel.panel_number}: ${panel.description}. Shot: ${panel.shot_type || 'Medium'}. Dialogue: "${panel.dialogue || ''}"\n`;
  });
  return prompt;
};

function App() {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingContent, setThinkingContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  const [config, setConfig] = useState(() => {
    return loadSavedConfig() || {
      styleText: '',
      extraPrompt: '',
      aspectRatio: '9:16',
      imageSize: '2K',
      styleImage: null,
      styleImagePreview: null
    };
  });

  const [prompt, setPrompt] = useState('');
  const [storyboard, setStoryboard] = useState(null);
  const [mangaPages, setMangaPages] = useState([]);

  const [firstPageImage, setFirstPageImage] = useState(null);
  const [firstPagePrompt, setFirstPagePrompt] = useState('');
  const [editableFirstPagePrompt, setEditableFirstPagePrompt] = useState('');
  const [tempRefImage, setTempRefImage] = useState(null);
  const [useCurrentAsRef, setUseCurrentAsRef] = useState(false);

  useEffect(() => { checkConfig(); }, []);

  // Save config to localStorage whenever it changes
  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const checkConfig = async () => {
    try { setIsConfigured((await checkConfigStatus()).is_configured); }
    catch (e) { setIsConfigured(false); }
  };

  const handleApiKeyChange = async (key) => {
    await setApiKey(key);
    setIsConfigured(true);
  };

  const getCombinedStyle = () => `${config.styleText || ''} ${config.extraPrompt || ''}`.trim();

  const handleReset = () => {
    setStep(0);
    setStoryboard(null);
    setMangaPages([]);
    setFirstPageImage(null);
    setFirstPagePrompt('');
    setEditableFirstPagePrompt('');
    setTempRefImage(null);
    setUseCurrentAsRef(false);
    setThinkingContent('');
    setTextContent('');
  };

  const handleStepClick = (targetStep) => {
    if (targetStep < step) setStep(targetStep);
  };

  // Step 0 -> 1 with streaming
  const handleStartStory = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    if (!isConfigured) {
      alert("Please configure your API key in the sidebar first.");
      return;
    }
    setIsLoading(true);
    setThinkingContent('');
    setTextContent('');

    try {
      await generateStoryboardStream(
        prompt, getCombinedStyle(), config.aspectRatio,
        (content, type) => {
          if (type === 'thinking') {
            setThinkingContent(prev => prev + content);
          } else {
            setTextContent(prev => prev + content);
          }
        },
        (result) => { setStoryboard(result); setStep(1); setIsLoading(false); setThinkingContent(''); setTextContent(''); },
        (error) => { alert("Error: " + error); setIsLoading(false); }
      );
    } catch (error) {
      console.error("Failed to generate storyboard", error);
      alert("Failed to generate storyboard.");
      setIsLoading(false);
    }
  };

  // Step 1 -> 2
  const handleStoryboardConfirm = async (finalStoryboard) => {
    setIsLoading(true);
    setThinkingContent('Generating first page preview...');
    setStoryboard(finalStoryboard);

    const pages = finalStoryboard.pages.map(page => ({
      ...page, imageUrl: null, status: 'pending',
      editablePrompt: buildPagePrompt(page, getCombinedStyle())
    }));
    setMangaPages(pages);

    if (pages.length > 0) {
      setFirstPagePrompt(pages[0].editablePrompt);
      setEditableFirstPagePrompt(pages[0].editablePrompt);
    }

    try {
      const result = await generatePagesBatch([finalStoryboard.pages[0]], getCombinedStyle(), config.aspectRatio, config.imageSize || '2K', config.styleImage, null);
      if (result.results?.[0]?.image) {
        setFirstPageImage(result.results[0].image);
        setMangaPages(prev => prev.map((p, idx) => idx === 0 ? { ...p, imageUrl: result.results[0].image, status: 'completed' } : p));
      }
      setStep(2);
    } catch (error) {
      console.error("First page generation failed", error);
      alert("First page generation failed.");
    } finally {
      setIsLoading(false);
      setThinkingContent('');
    }
  };

  // Step 2: Regenerate First Page
  const handleRegenerateFirstPage = async () => {
    setIsLoading(true);
    setThinkingContent('Regenerating first page...');
    try {
      let refImage = tempRefImage;
      // If "Use Current" is checked, firstPageImage becomes the "Additional" ref to be specific? 
      // User Logic: "Prompt needs to include 'User input [Image] as reference'"
      // Strategy: 
      // Main Ref (Style) -> config.styleImage (or null)
      // Additional Ref -> tempRefImage OR firstPageImage (if using current)

      let additionalImage = tempRefImage;
      if (useCurrentAsRef && firstPageImage) {
        additionalImage = firstPageImage;
      }

      // Check logic: 
      // 1. Style Anchor: config.styleImage (Sidebar)
      // 2. Additional: The user's specific input

      const result = await generatePagesBatch([{ ...storyboard.pages[0], _custom_prompt: editableFirstPagePrompt }], getCombinedStyle(), config.aspectRatio, config.imageSize || '2K', config.styleImage, null, additionalImage);
      if (result.results?.[0]?.image) {
        setFirstPageImage(result.results[0].image);
        setMangaPages(prev => prev.map((p, idx) => idx === 0 ? { ...p, imageUrl: result.results[0].image, status: 'completed' } : p));
        setFirstPagePrompt(editableFirstPagePrompt);
      }
    } catch (error) {
      alert("Regeneration failed.");
    } finally {
      setIsLoading(false);
      setThinkingContent('');
    }
  };

  // Step 2 -> 3
  const handleConfirmFirstPage = async () => {
    if (mangaPages.length <= 1) { setStep(3); return; }
    setIsLoading(true);
    setThinkingContent('Generating remaining pages...');
    setStep(3);

    try {
      // Use firstPageImage as the definitive style reference for the batch
      // This ensures consistency with the confirmed first page
      const batchStyleRefImage = firstPageImage || config.styleImage;

      // Use editableFirstPagePrompt as the definitive prompt source
      const result = await generatePagesBatch(storyboard.pages.slice(1), getCombinedStyle(), config.aspectRatio, config.imageSize || '2K', batchStyleRefImage, editableFirstPagePrompt);
      const resultMap = {};
      result.results.forEach(r => { resultMap[r.page_number] = r.image; });
      setMangaPages(prev => prev.map(page => page.page_number === 1 ? page : { ...page, imageUrl: resultMap[page.page_number] || null, status: resultMap[page.page_number] ? 'completed' : 'failed' }));
    } catch (error) {
      alert("Remaining pages generation failed.");
    } finally {
      setIsLoading(false);
      setThinkingContent('');
    }
  };

  // Gallery: Regenerate with streaming
  const handlePageRegenerate = async (pageNumber, editedPrompt, extraRefImage, usePrevAsRef) => {
    setIsLoading(true);
    setThinkingContent('');
    setTextContent('');

    // Find the page in mangaPages (which has correct page_number)
    const pageData = mangaPages.find(p => p.page_number === pageNumber);
    if (!pageData) {
      console.error("Page not found:", pageNumber);
      setIsLoading(false);
      return;
    }

    // Update status to pending
    setMangaPages(prev => prev.map(p => p.page_number === pageNumber ? { ...p, status: 'pending' } : p));

    try {
      // New Logic for Multi-Image Support
      // 1. Style Anchor: Always use firstPageImage (or config.styleImage fallback)
      // 2. Additional Ref: Use extraRefImage OR current page image (if "Use Current" checked)

      let styleRefImage = (usePrevAsRef && pageData.imageUrl) ? pageData.imageUrl : (firstPageImage || config.styleImage);
      let additionalRefImage = extraRefImage;

      // Build page data for generation - ensure page_number is explicitly set
      const regeneratePageData = {
        page_number: pageNumber,
        layout_description: pageData.layout_description,
        panels: pageData.panels,
        _custom_prompt: editedPrompt
      };

      console.log("Regenerating page with streaming:", regeneratePageData.page_number);

      await generatePageStream(
        regeneratePageData,
        getCombinedStyle(),
        config.aspectRatio,
        config.imageSize || '2K',
        styleRefImage,
        pageNumber === 1 ? null : firstPagePrompt,
        additionalRefImage,
        // onThinking
        (content) => setThinkingContent(prev => prev + content),
        // onImage
        (imageBase64, resultPageNum) => {
          console.log("Received image for page:", resultPageNum);
          setMangaPages(prev => prev.map(p =>
            p.page_number === pageNumber ? { ...p, imageUrl: imageBase64, status: 'completed', editablePrompt: editedPrompt } : p
          ));
          if (pageNumber === 1) {
            setFirstPageImage(imageBase64);
            setFirstPagePrompt(editedPrompt); // Critical: Update reference prompt if Page 1 changes
          }
        },
        // onError
        (error) => {
          console.error("Page regeneration error:", error);
          setMangaPages(prev => prev.map(p =>
            p.page_number === pageNumber ? { ...p, status: 'failed' } : p
          ));
        }
      );
    } catch (error) {
      console.error("Page regeneration failed:", error);
      alert("Page regeneration failed.");
      setMangaPages(prev => prev.map(p =>
        p.page_number === pageNumber ? { ...p, status: 'failed' } : p
      ));
    } finally {
      setIsLoading(false);
      setThinkingContent('');
    }
  };

  const handleTempRefImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTempRefImage(reader.result.replace('data:', '').replace(/^.+,/, ''));
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadAll = () => {
    mangaPages.forEach(page => {
      if (page.imageUrl) {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${page.imageUrl}`;
        link.download = `manga_page_${page.page_number}.png`;
        link.click();
      }
    });
  };

  return (
    <div className="app-container">
      <ConfigSidebar
        config={config}
        onConfigChange={setConfig}
        isLoading={isLoading}
        isConfigured={isConfigured}
        onApiKeyChange={handleApiKeyChange}
      />

      <main className="main-content">
        <header className="step-header">
          <h1 className="title">AI Manga Generator</h1>
          <div className="header-controls">
            {step > 0 && <button onClick={handleReset} className="reset-btn">← Start Over</button>}
            <div className="steps-indicator">
              {['Start', 'Storyboard', 'Preview', 'Gallery'].map((label, idx) => (
                <span key={idx} className={`step-item ${step === idx ? 'active' : ''} ${idx < step ? 'clickable' : ''}`} onClick={() => idx < step && handleStepClick(idx)}>
                  {idx + 1}. {label}
                </span>
              ))}
            </div>
          </div>
        </header>

        {(isLoading || thinkingContent || textContent) && <ThinkingStream thinkingContent={thinkingContent} textContent={textContent} isThinking={isLoading} />}

        {step === 0 && !isLoading && (
          <div className="start-screen">
            <h2>What story do you want to tell?</h2>
            <form onSubmit={handleStartStory} className="start-input">
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="A lost robot finds a flower in the wasteland..." style={{ minHeight: '300px', fontSize: '1.1rem', width: '100%' }} />
              <button type="submit" className="primary" style={{ marginTop: '1rem' }}>Start Creating</button>
            </form>
          </div>
        )}

        {step === 1 && storyboard && !isLoading && <StoryboardEditor storyboard={storyboard} onGenerate={handleStoryboardConfirm} isLoading={isLoading} />}

        {step === 2 && !isLoading && (
          <div className="first-page-preview">
            <h2>First Page Preview</h2>
            <p>Iterate until satisfied. This sets the style for remaining pages.</p>
            <div className="preview-container">
              {firstPageImage ? <img src={`data:image/png;base64,${firstPageImage}`} alt="First Page" className="preview-image" /> : <div className="loading-placeholder"><p>No image yet</p></div>}
            </div>
            <div className="regen-options">
              <label>Edit Prompt:</label>
              <textarea value={editableFirstPagePrompt} onChange={(e) => setEditableFirstPagePrompt(e.target.value)} rows={5} style={{ width: '100%', marginBottom: '0.5rem' }} />
              <div className="option-row"><label><input type="checkbox" checked={useCurrentAsRef} onChange={(e) => setUseCurrentAsRef(e.target.checked)} /> Use current image as reference</label></div>
              <div className="option-row">
                <label>Or upload extra reference image:</label>
                <input type="file" accept="image/*" onChange={handleTempRefImageUpload} />
                {tempRefImage && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.9rem' }}>Uploaded:</span>
                    <img src={`data:image/png;base64,${tempRefImage}`} alt="Ref" style={{ height: '40px', border: '1px solid #ccc' }} />
                    <button
                      onClick={() => setTempRefImage(null)}
                      style={{ background: '#ff4444', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="preview-actions">
              <button onClick={handleRegenerateFirstPage} className="secondary">Regenerate First Page</button>
              <button onClick={handleConfirmFirstPage} disabled={!firstPageImage} className="primary">Confirm & Generate All</button>
            </div>
          </div>
        )}

        {step === 3 && <MangaGallery pages={mangaPages} onPageRegenerate={handlePageRegenerate} isLoading={isLoading} onDownloadAll={handleDownloadAll} />}
      </main>
    </div>
  );
}

export default App;
