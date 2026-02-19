import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, X, MessageCircle } from 'lucide-react';
// Assuming CSS is globally available via App.jsx importing App.css or index.css
// If not, we might need to import it here too, but usually App.css is global.

const CaptionFactoryResults = () => {
    const [selectedCaption, setSelectedCaption] = useState(null);
    const [copied, setCopied] = useState(false);
    const [results, setResults] = useState(null);

    useEffect(() => {
        // Mock data for development
        // In production, this would come from sessionStorage, URL params, or API
        const mockResults = {
            captions: [
                {
                    text: "วันนี้พักผ่อนที่ Yunomori Onsen ✨\nเติมพลังกายและใจให้พร้อมสำหรับสัปดาห์ใหม่\n\nบางทีสิ่งที่เราต้องการคือเวลาให้กับตัวเอง\nเพื่อชาร์จแบตเตอรี่ชีวิตให้เต็มอีกครั้ง 💆‍♀️🌿",
                    hashtags: "#YunomoriOnsen #SelfCare #WellnessJourney #MeTime #RelaxAndRecharge"
                },
                {
                    text: "Recharge mode: ON 🔋✨\n\nเมื่อชีวิตเร่งรีบ เราก็ต้องหยุดพักบ้าง\nYunomori Onsen คือที่ที่ทำให้ทุกอย่างช้าลง\nและให้เราได้กลับมาเป็นตัวเองอีกครั้ง\n\nReady to face the world again 💪💖",
                    hashtags: "#OnsenThailand #WellnessLifestyle #SelfLove #RelaxTime #BangkokOnsen"
                }
            ],
            mood: 'CALM',
            multilingualLevel: 50
        };

        // Simulate loading
        setTimeout(() => {
            setResults(mockResults);
        }, 500);
    }, []);

    const handleCopyToClipboard = () => {
        if (selectedCaption !== null && results) {
            const caption = results.captions[selectedCaption];
            const fullText = `${caption.text}\n\n${caption.hashtags}`;

            navigator.clipboard.writeText(fullText).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    const handleClose = () => {
        if (window.liff && window.liff.isInClient()) {
            window.liff.closeWindow();
        } else {
            window.close();
        }
    };

    if (!results) {
        return (
            <div className="app-container" style={{ flexDirection: 'column', gap: '20px' }}>
                <div className="icon-box animate-spin" style={{ background: 'var(--c-cyan)' }}>
                    <Sparkles size={28} color="white" strokeWidth={2.5} />
                </div>
                <p style={{ fontWeight: 600 }}>Loading results...</p>
            </div>
        );
    }

    return (
        <div className="app-container">
            <div className="main-card neo-box">
                {/* Header */}
                <div className="header-section" style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <div className="title-wrapper">
                        <div className="icon-box" style={{ background: 'var(--c-green)' }}>
                            <MessageCircle size={28} color="white" strokeWidth={2.5} />
                        </div>
                        <h1 className="main-title" style={{ background: 'var(--c-green)', fontSize: '1.8rem' }}>
                            YOUR CAPTIONS!
                        </h1>
                    </div>
                    <p className="subtitle">เลือกแคปชั่นที่ชอบแล้ว Copy ได้เลย ✨</p>
                </div>

                {/* Results List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {results.captions.map((caption, index) => (
                        <div
                            key={index}
                            onClick={() => setSelectedCaption(index)}
                            className="neo-box"
                            style={{
                                padding: '1.5rem',
                                cursor: 'pointer',
                                position: 'relative',
                                marginTop: '10px',
                                borderWidth: '2px',
                                // Highlight selected
                                background: selectedCaption === index ? '#fff' : '#fafafa',
                                borderColor: selectedCaption === index ? 'var(--c-magenta)' : 'var(--c-black)',
                                transform: selectedCaption === index ? 'translate(-2px, -2px)' : 'none',
                                boxShadow: selectedCaption === index ? 'var(--shadow-hard-hover)' : 'none'
                            }}
                        >
                            {/* Selection Checkmark */}
                            <div style={{
                                position: 'absolute',
                                top: '-12px',
                                left: '10px',
                                background: selectedCaption === index ? 'var(--c-magenta)' : '#ccc',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: '800',
                                border: '2px solid black',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                {selectedCaption === index && <Check size={14} strokeWidth={4} />}
                                OPTION {index + 1}
                            </div>

                            <p style={{
                                whiteSpace: 'pre-wrap',
                                lineHeight: '1.6',
                                marginBottom: '1rem',
                                fontSize: '1rem'
                            }}>
                                {caption.text}
                            </p>

                            <div style={{
                                borderTop: '2px dashed #eee',
                                paddingTop: '1rem',
                                color: '#666',
                                fontSize: '0.9rem',
                                fontStyle: 'italic'
                            }}>
                                {caption.hashtags}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div style={{ marginTop: '2rem', display: 'flex', gap: '10px', flexDirection: 'column' }}>
                    <button
                        onClick={handleCopyToClipboard}
                        disabled={selectedCaption === null}
                        className="neo-btn"
                        style={{
                            background: copied ? 'var(--c-green)' : 'var(--c-yellow)',
                            padding: '1.2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '1.1rem',
                            opacity: selectedCaption === null ? 0.5 : 1
                        }}
                    >
                        {copied ? (
                            <>
                                <Check size={24} />
                                <span style={{ color: 'black' }}>COPIED SUCCESS!</span>
                            </>
                        ) : (
                            <>
                                <Copy size={24} />
                                <span>COPY CAPTION</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleClose}
                        className="neo-btn"
                        style={{
                            background: '#fff',
                            padding: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            color: '#666'
                        }}
                    >
                        <X size={20} />
                        Close Window
                    </button>
                </div>

                {selectedCaption === null && (
                    <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--c-magenta)', marginTop: '10px', fontWeight: '600' }}>
                        👆 กรุณาจิ้มเลือกแคปชั่นที่ชอบก่อนนะคะ
                    </p>
                )}

            </div>
        </div>
    );
};

export default CaptionFactoryResults;
