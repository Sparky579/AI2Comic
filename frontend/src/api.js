import axios from 'axios';

const API_BASE_URL = 'https://ai2comic-api.sparky.qzz.io';

export const generateStoryboard = async (prompt, referenceStyle = "", aspectRatio = "16:9") => {
    const response = await axios.post(`${API_BASE_URL}/generate/storyboard`, {
        prompt,
        reference_style: referenceStyle,
        aspect_ratio: aspectRatio
    });
    return response.data;
};

// SSE streaming version for storyboard
export const generateStoryboardStream = (prompt, referenceStyle = "", aspectRatio = "16:9", onThinking, onResult, onError) => {
    return new Promise((resolve, reject) => {
        fetch(`${API_BASE_URL}/generate/storyboard/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                reference_style: referenceStyle,
                aspect_ratio: aspectRatio
            })
        }).then(response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            function read() {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        resolve();
                        return;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n\n');
                    buffer = lines.pop(); // Keep incomplete line

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (data.type === 'thinking') {
                                    onThinking(data.content, 'thinking');
                                } else if (data.type === 'text') {
                                    onThinking(data.content, 'text');
                                } else if (data.type === 'result') {
                                    onResult(data.content);
                                } else if (data.type === 'error') {
                                    onError(data.content);
                                }
                            } catch (e) {
                                console.error('Parse error:', e);
                            }
                        }
                    }
                    read();
                }).catch(reject);
            }
            read();
        }).catch(reject);
    });
};

export const generateImage = async (panelPrompt, styleReference, aspectRatio, panelId, initialImageBase64 = null, styleReferenceImageBase64 = null) => {
    const response = await axios.post(`${API_BASE_URL}/generate/image`, {
        panel_prompt: panelPrompt,
        style_reference: styleReference,
        aspect_ratio: aspectRatio,
        panel_id: panelId,
        initial_image_base64: initialImageBase64,
        style_reference_image_base64: styleReferenceImageBase64
    });
    return response.data;
};

export const generatePagesBatch = async (pages, styleReference, aspectRatio, imageSize, styleImage, referencePrompt = null) => {
    const response = await axios.post(`${API_BASE_URL}/generate/pages/batch`, {
        pages,
        style_reference: styleReference,
        aspect_ratio: aspectRatio,
        image_size: imageSize,
        style_reference_image_base64: styleImage,
        reference_prompt: referencePrompt
    });
    return response.data;
};

// SSE streaming for single page generation (with thinking output)
export const generatePageStream = (page, styleReference, aspectRatio, imageSize, styleImage, referencePrompt, onThinking, onImage, onError) => {
    return new Promise((resolve, reject) => {
        fetch(`${API_BASE_URL}/generate/page/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                page,
                style_reference: styleReference,
                aspect_ratio: aspectRatio,
                image_size: imageSize,
                style_reference_image_base64: styleImage,
                reference_prompt: referencePrompt
            })
        }).then(response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            function read() {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        resolve();
                        return;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n\n');
                    buffer = lines.pop();

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (data.type === 'thinking') {
                                    onThinking(data.content);
                                } else if (data.type === 'image') {
                                    onImage(data.content, data.page_number);
                                } else if (data.type === 'error') {
                                    onError(data.content);
                                }
                            } catch (e) {
                                console.error('Parse error:', e);
                            }
                        }
                    }
                    read();
                }).catch(reject);
            }
            read();
        }).catch(reject);
    });
};

export const checkConfigStatus = async () => {
    const response = await axios.get(`${API_BASE_URL}/config/status`);
    return response.data;
};

export const setApiKey = async (apiKey) => {
    const response = await axios.post(`${API_BASE_URL}/config/api-key`, {
        api_key: apiKey
    });
    return response.data;
};
