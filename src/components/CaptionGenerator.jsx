import React, { useState, useRef } from 'react';
import { Camera, Upload, Send, Copy, Check, Sparkles, Coffee, Briefcase, Hash, RefreshCw, Settings, Save, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './CaptionGenerator.css';

const WEBHOOK_URL = 'https://hook.eu2.make.com/gqvrys1k2qx4pci273my7fbrxqjjag2t';

function CaptionGenerator() {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [checkIn, setCheckIn] = useState('');
    const [mood, setMood] = useState('Aesthetic');
    const [userWords, setUserWords] = useState('');
    const [mlLevel, setMlLevel] = useState(50);
    const [captions, setCaptions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            processFile(file);
        }
    };

    const processFile = (file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
            const base64 = reader.result.split(',')[1];
            setImage(base64);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!image) return;

        setLoading(true);
        setCaptions(null);

        try {
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_base64: image,
                    user_email: 'user@example.com',
                    check_in: checkIn,
                    mood: mood,
                    user_words: userWords,
                    multilingual_level: mlLevel
                })
            });

            const result = await response.json();
            setCaptions(result);
        } catch (error) {
            console.error('Error generating captions:', error);
            // Fallback for demo purposes if webhook fails
            /*
            setCaptions({
              style1: "Coffee and vibes. ☕️✨ Life is better when it's brewing.",
              style2: "Professional morning routine at the local cafe. Productivity at its peak.",
              hashtags: "#CoffeeLover #MorningVibes #Productivity #CafeStyle"
            });
            */
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="generator-card">
            <header className="card-header-main">
                <Camera size={28} className="header-icon" />
                <h2 className="factory-title">Caption Factory iDEAS</h2>
            </header>

            {!captions ? (
                <div className="upload-section">
                    <div
                        className={`drop-zone ${preview ? 'has-preview' : ''}`}
                        onClick={() => fileInputRef.current.click()}
                    >
                        {preview ? (
                            <img src={preview} alt="Preview" className="image-preview" />
                        ) : (
                            <div className="upload-prompt">
                                <div className="icon-circle">
                                    <Upload size={32} />
                                </div>
                                <p>[Upload Image] หรือ [ลากไฟล์มาวาง]</p>
                                <span>Supports JPG, PNG</span>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                    </div>

                    <div className="controls-grid">
                        <div className="input-group">
                            <label>📍 Check-in (optional):</label>
                            <div className="input-wrapper">
                                <select
                                    className="styled-select"
                                    value={checkIn}
                                    onChange={(e) => setCheckIn(e.target.value)}
                                >
                                    <option value="">เลือกสถานที่...</option>
                                    <option value="Yunomori Onsen">Yunomori Onsen</option>
                                    <option value="Cafe Amazon">Cafe Amazon</option>
                                    <option value="Siam Paragon">Siam Paragon</option>
                                </select>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Mood & Vibe</label>
                            <div className="chip-group">
                                {[
                                    { id: 'Vibrant', label: 'Vibrant' },
                                    { id: 'Calm', label: 'Calm' },
                                    { id: 'Fun', label: 'Fun' },
                                    { id: 'Luxury', label: 'Luxury' },
                                    { id: 'Aesthetic', label: 'Aesthetic' }
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        className={`chip ${mood === m.id ? 'active' : ''}`}
                                        onClick={() => setMood(m.id)}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="input-group">
                            <label>📝 Your words:</label>
                            <div className="input-wrapper">
                                <input
                                    placeholder="โปรโมชั่น 50%, จัดเต็ม..."
                                    value={userWords}
                                    onChange={(e) => setUserWords(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="input-group full-width">
                            <div className="label-with-value">
                                <label>⚡ Multilingual Level:</label>
                                <span className="level-indicator">
                                    ({mlLevel < 33 ? 'Light' : mlLevel < 66 ? 'Medium' : 'Heavy'})
                                </span>
                            </div>
                            <div className="slider-container">
                                <span className="slider-label">Light</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={mlLevel}
                                    onChange={(e) => setMlLevel(parseInt(e.target.value))}
                                    className="custom-range"
                                />
                                <span className="slider-label">Heavy</span>
                            </div>
                        </div>
                    </div>

                    <button
                        className={`generate-btn ${(!image || loading) ? 'disabled' : ''}`}
                        onClick={handleSubmit}
                        disabled={!image || loading}
                    >
                        {loading ? (
                            <div className="spinner"></div>
                        ) : (
                            "Generate Caption"
                        )}
                    </button>
                </div>
            ) : (
                <motion.div
                    className="results-section"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className="analysis-summary">
                        <div className="summary-image">
                            <img src={preview} alt="Summary" />
                        </div>
                        <div className="summary-text">
                            <h3>✨ แคปชั่นที่สร้างให้คุณ</h3>
                            <p><strong>AI เห็น:</strong> {captions.ai_analysis}</p>
                        </div>
                    </div>

                    <div className="captions-list">
                        <ResultCard
                            title="Style 1: Light (เบาๆ)"
                            content={captions.style1.text}
                            engagement={captions.style1.engagement}
                            onCopy={(text) => copyToClipboard(text, 1)}
                            isCopied={copiedIndex === 1}
                        />
                        <ResultCard
                            title="Style 2: Medium (กลาง)"
                            content={captions.style2.text}
                            engagement={captions.style2.engagement}
                            onCopy={(text) => copyToClipboard(text, 2)}
                            isCopied={copiedIndex === 2}
                        />
                        <ResultCard
                            title="Style 3: Heavy (เข้ม)"
                            content={captions.style3.text}
                            engagement={captions.style3.engagement}
                            onCopy={(text) => copyToClipboard(text, 3)}
                            isCopied={copiedIndex === 3}
                        />
                    </div>

                    <div className="result-actions">
                        <button className="secondary-btn" onClick={() => setCaptions(null)}>
                            <RefreshCw size={18} />
                            Generate Again
                        </button>
                        <button className="secondary-btn">
                            <Settings size={18} />
                            Customize
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

function ResultCard({ title, content, engagement, onCopy, isCopied }) {
    return (
        <div className="result-card">
            <div className="result-card-header">
                <span className="style-title">{title}</span>
                <div className="action-buttons">
                    <button className="action-icon-btn" onClick={() => onCopy(content)}>
                        {isCopied ? <Check size={16} /> : <Copy size={16} />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button className="action-icon-btn">
                        <Save size={16} />
                        <span>Save</span>
                    </button>
                    <button className="action-icon-btn">
                        <Share2 size={16} />
                        <span>Share</span>
                    </button>
                </div>
            </div>
            <div className="result-card-body">
                <p>{content}</p>
            </div>
            <div className="result-card-footer">
                <span className="engagement-tag">
                    Engagement Prediction: {engagement} 📊
                </span>
            </div>
        </div>
    );
}

export default CaptionGenerator;
