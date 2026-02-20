import React, { useState, useRef } from 'react';
import { Camera, Sparkles, Loader2, Zap, Image as ImageIcon } from 'lucide-react';
import { captionFactoryService } from '../services/captionFactoryService';
import { databaseService } from '../services/databaseService';

const CaptionFactoryUpload = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [mood, setMood] = useState('VIBRANT');
  const [multilingualLevel, setMultilingualLevel] = useState(50);
  const [captionText, setCaptionText] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const moods = [
    { id: 'VIBRANT', label: 'Vibrant', emoji: '✨', color: 'var(--c-magenta)' },
    { id: 'CALM', label: 'Calm', emoji: '🌊', color: 'var(--c-cyan)' },
    { id: 'FUN', label: 'Fun', emoji: '🎉', color: 'var(--c-yellow)' },
    { id: 'LUXURY', label: 'Luxury', emoji: '👑', color: '#9d4edd' },
    { id: 'AESTHETIC', label: 'Aesthetic', emoji: '🎨', color: 'var(--c-green)' }
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('ขนาดไฟล์ใหญ่เกิน 10MB กรุณาเลือกไฟล์ที่เล็กกว่า');
        return;
      }

      setImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        setImagePreview(result);
        const base64String = result.split(',')[1];
        setImageBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const getMultilingualLabel = () => {
    if (multilingualLevel < 25) return 'Light';
    if (multilingualLevel < 50) return 'Medium';
    if (multilingualLevel < 75) return 'High';
    return 'Heavy';
  };

  const handleSubmit = async () => {
    if (!image || !imageBase64) {
      alert('กรุณาอัพโหลดรูปภาพก่อนค่ะ 📸');
      return;
    }

    setLoading(true);

    try {
      let userId = 'web-user';
      let displayName = 'Web User';

      // Try to get LINE LIFF user info if available
      if (window.liff && window.liff.isLoggedIn()) {
        try {
          const profile = await window.liff.getProfile();
          userId = profile.userId;
          displayName = profile.displayName;
        } catch (liffError) {
          console.warn('LIFF profile fetch failed, using defaults:', liffError);
        }
      }

      // ✅ NEW: Save submission to database (replaces webhook)
      console.log('💾 Saving caption submission to database...');
      const submission = await captionFactoryService.saveSubmission(
        userId,
        displayName,
        `data:${image.type};base64,${imageBase64}`,
        mood,
        multilingualLevel,
        captionText
      );

      console.log('✅ Submission saved:', submission.id);

      // ✅ NEW: Generate captions locally (replaces Make.com)
      console.log('🎨 Generating captions...');
      const captions = await captionFactoryService.generateCaptions(
        imageBase64,
        mood,
        multilingualLevel,
        captionText
      );

      // ✅ NEW: Update submission with generated captions
      await captionFactoryService.processSubmission(submission.id, captions);

      console.log('✅ Captions generated and saved:', captions);

      // Show success message
      alert('✨ สร้างแคปชั่นสำเร็จแล้ว!\n\nแคปชั่นของคุณพร้อมแล้ว คัดลอกและไปโพสต์ได้เลย 💖');

      // Store captions in sessionStorage for results page
      sessionStorage.setItem('captionResults', JSON.stringify(captions));
      sessionStorage.setItem('captionPreview', imagePreview);

      // Close LIFF window if in LINE
      if (window.liff && window.liff.isInClient()) {
        window.liff.closeWindow();
      }

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งค่ะ 🙏\n' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="main-card neo-box">
        <div className="header-section" style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-10px', right: '0', zIndex: 10 }}>
            <img src="/ideas365-logo.png" alt="iDEAS365" style={{ height: '50px', width: 'auto' }} />
          </div>
          <div className="title-wrapper">
            <div className="icon-box" style={{ background: 'var(--c-magenta)' }}>
              <Camera size={28} color="white" strokeWidth={2.5} />
            </div>
            <h1 className="main-title">CAPTION FACTORY</h1>
          </div>
        </div>

        <div className="section-block">
          <label className="section-label">
            <Camera size={20} />
            อัพโหลดรูปภาพ
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`upload-area ${!imagePreview ? 'empty' : ''}`}
          >
            {imagePreview ? (
              <div className="preview-container">
                <img src={imagePreview} alt="Preview" className="preview-img" />
                <div className="preview-overlay">
                  <span className="neo-btn" style={{ background: 'var(--c-yellow)', fontSize: '0.8rem', padding: '8px 16px' }}>
                    คลิกเพื่อเปลี่ยนรูป
                  </span>
                </div>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <ImageIcon size={48} color="#000" strokeWidth={1} style={{ marginBottom: '1rem' }} />
                </div>
                <p style={{ fontWeight: 600, margin: 0 }}>คลิกเพื่ออัพโหลดรูป</p>
                <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: '5px 0 0 0' }}>JPG, PNG (สูงสุด 10MB)</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </div>

        <div className="section-block">
          <label className="section-label">
            <Sparkles size={20} />
            Mood & Vibe
          </label>
          <div className="mood-grid">
            {moods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMood(m.id)}
                className="mood-btn neo-btn"
                style={{
                  background: mood === m.id ? m.color : '#fff',
                  transform: mood === m.id ? 'translate(-2px, -2px)' : 'none',
                  boxShadow: mood === m.id ? 'var(--shadow-hard-hover)' : 'var(--shadow-hard)'
                }}
              >
                <span className="mood-emoji">{m.emoji}</span>
                <span className="mood-label">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="section-block">
          <div className="label-row">
            <label className="section-label">
              <Zap size={20} />
              Multilingual Level
            </label>
            <span className="level-badge" style={{ background: 'var(--c-green)' }}>
              {getMultilingualLabel()}
            </span>
          </div>

          <div className="slider-wrapper">
            <input
              type="range"
              min="0"
              max="100"
              step="25"
              value={multilingualLevel}
              onChange={(e) => setMultilingualLevel(parseInt(e.target.value))}
              className="custom-slider"
            />
            <div className="slider-labels">
              <span>Light</span>
              <span>Medium</span>
              <span>High</span>
              <span>Heavy</span>
            </div>
          </div>
        </div>

        <div className="section-block">
          <label className="section-label">
            Your text in caption <span style={{ opacity: 0.5, marginLeft: '5px' }}>(optional)</span>
          </label>
          <textarea
            value={captionText}
            onChange={(e) => setCaptionText(e.target.value)}
            placeholder="ใส่ข้อความที่อยากให้มีในแคปชั่น เช่น กาแฟดี, relax, weekend..."
            rows="3"
            className="neo-input"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !image}
          className="submit-btn neo-btn"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles />
              LET'S GO!
            </>
          )}
        </button>

        <div className="footer-copyright">
          <p>© 2025 All Rights Reserved. | Curated by iDEAS365 x Generative AI</p>
        </div>
      </div>
    </div>
  );
};

export default CaptionFactoryUpload;
