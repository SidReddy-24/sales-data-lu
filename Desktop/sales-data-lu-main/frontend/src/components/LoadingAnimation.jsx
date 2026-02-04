import React, { useState, useEffect } from 'react';

const LoadingAnimation = ({ onComplete, isReady }) => {
    const [progress, setProgress] = useState(0);
    const [currentStage, setCurrentStage] = useState(0);

    // ... stages definition unchanged ...
    const stages = [
        // ... (preserving content)
        {
            title: '🧠 Analyzing Your Profile',
            subtitle: 'Understanding your background and goals...',
            icon: '🧠',
            progress: 20
        },
        {
            title: '🎯 Mapping Learning Path',
            subtitle: 'Crafting personalized learning modules...',
            icon: '🎯',
            progress: 40
        },
        {
            title: '🚀 Optimizing Timeline',
            subtitle: 'Adjusting based on your availability...',
            icon: '🚀',
            progress: 60
        },
        {
            title: '⚡ Customizing Experience',
            subtitle: 'Tailoring content to your needs...',
            icon: '⚡',
            progress: 80
        },
        {
            title: '✨ Finalizing Your Journey',
            subtitle: 'Preparing your premium experience...',
            icon: '✨',
            progress: 100
        }
    ];

    useEffect(() => {
        // Simulate loading progress
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    // Call onComplete callback after a brief delay
                    if (onComplete) {
                        setTimeout(() => {
                            onComplete();
                        }, 200);
                    }
                    return 100;
                }

                if (!isReady && prev >= 98) {
                    return 98; // Stay at 98% until isReady is true
                }

                // Slower increment when not ready, faster when ready to finish
                const increment = isReady ? 2 : 1;
                return prev + increment > 100 ? 100 : prev + increment;
            });
        }, isReady ? 50 : 150); // Slower initial progress (150ms vs original 25ms)

        return () => clearInterval(interval);
    }, [onComplete, isReady]);

    useEffect(() => {
        // Update current stage based on progress
        const stage = stages.findIndex((s) => progress <= s.progress);
        if (stage !== -1 && stage !== currentStage) {
            setCurrentStage(stage);
        }
    }, [progress]);

    return (
        <div className="loading-animation-overlay">
            <div className="loading-animation-card">
                {/* Animated Rocket Icon */}
                <div className="rocket-container">
                    <div className="rocket-glow"></div>
                    <div className="rocket-icon">
                        <svg
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M12 2L4 9L7 12L12 7L17 12L20 9L12 2Z"
                                fill="white"
                                opacity="0.9"
                            />
                            <path
                                d="M7 12L5 14L10 19L12 17L7 12Z"
                                fill="white"
                                opacity="0.7"
                            />
                            <path
                                d="M17 12L19 14L14 19L12 17L17 12Z"
                                fill="white"
                                opacity="0.7"
                            />
                            <circle cx="12" cy="10" r="1.5" fill="white" />
                        </svg>
                    </div>
                </div>

                {/* Dynamic Title */}
                <h2 className="loading-title">
                    {stages[currentStage]?.title || '🚀 Loading...'}
                </h2>
                <p className="loading-subtitle">
                    {stages[currentStage]?.subtitle || 'Please wait...'}
                </p>

                {/* Progress Bar */}
                <div className="progress-bar-container">
                    <div className="progress-bar-track">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Stage Icons */}
                <div className="stage-icons">
                    {stages.map((stage, index) => (
                        <div
                            key={index}
                            className={`stage-icon ${progress >= stage.progress ? 'active' : ''
                                }`}
                        >
                            <span>{stage.icon}</span>
                        </div>
                    ))}
                </div>

                {/* Progress Percentage */}
                <div className="progress-percentage">{progress}%</div>

                {/* Bottom Tagline */}
                <p className="loading-tagline">CREATING YOUR PREMIUM JOURNEY</p>
            </div>
        </div>
    );
};

export default LoadingAnimation;
