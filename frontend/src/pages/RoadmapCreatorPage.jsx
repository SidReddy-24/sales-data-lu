import { useEffect, useState } from 'react';
import LoadingAnimation from '../components/LoadingAnimation';
import RoadmapCreatorForm from '../components/RoadmapCreatorForm';
import RoadmapPreview from '../components/RoadmapPreview';

const STATES = {
    INPUT: 'input',
    LOADING: 'loading',
    RESULTS: 'results',
    ERROR: 'error',
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const RoadmapCreatorPage = () => {
    const [creatorState, setCreatorState] = useState(STATES.INPUT);
    const [creatorError, setCreatorError] = useState('');
    const [roadmapResult, setRoadmapResult] = useState(null);
    const [shareUrl, setShareUrl] = useState('');
    const [analyzerUrl, setAnalyzerUrl] = useState('');
    const [isDataReady, setIsDataReady] = useState(false);
    const [pendingData, setPendingData] = useState(null);

    const parseJsonResponse = async (response) => {
        const text = await response.text();
        if (!text) return {};
        try {
            return JSON.parse(text);
        } catch (parseError) {
            throw new Error('Unexpected response from server. Please try again.');
        }
    };

    const handleGenerateRoadmap = async (payload) => {
        setCreatorState(STATES.LOADING);
        setCreatorError('');

        try {
            if (payload.linkedinUrl) {
                setAnalyzerUrl(payload.linkedinUrl.trim());
            }

            const formData = new FormData();
            Object.entries(payload).forEach(([key, value]) => {
                if (value === undefined || value === null || key === 'resumeFile') return;
                formData.append(key, value);
            });

            if (payload.resumeFile) {
                formData.append('resume', payload.resumeFile);
            }

            const response = await fetch(`${API_BASE_URL}/api/roadmap/generate`, {
                method: 'POST',
                body: formData,
            });

            const data = await parseJsonResponse(response);

            if (!response.ok) throw new Error(data.error || 'Failed to generate roadmap');

            if (data.success) {
                setPendingData(data);
                setIsDataReady(true);
                // State will be set to RESULTS in handleLoadingComplete
            } else {
                throw new Error(data.error || 'Roadmap generation failed');
            }
        } catch (err) {
            console.error('Roadmap generation error:', err);
            setCreatorError(err.message);
            setCreatorState(STATES.ERROR);
        }
    };

    const handleCreatorReset = () => {
        setCreatorState(STATES.INPUT);
        setCreatorError('');
        setRoadmapResult(null);
        setShareUrl('');
        setPendingData(null);
        setIsDataReady(false);
        window.history.pushState({}, '', '/career-roadmap-LUWP');
    };

    const handleLoadingComplete = () => {
        if (pendingData) {
            setRoadmapResult(pendingData.data);
            setShareUrl(pendingData.shareUrl || '');
            setCreatorState(STATES.RESULTS);
            if (pendingData.id) {
                window.history.pushState({}, '', `/career-roadmap-LUWP?roadmapId=${pendingData.id}`);
            }
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const roadmapId = params.get('roadmapId');
        if (!roadmapId) return;

        setCreatorState(STATES.LOADING);

        fetch(`${API_BASE_URL}/api/roadmap/${roadmapId}`)
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    setRoadmapResult(data.data);
                    setCreatorState(STATES.RESULTS);
                    setShareUrl(`${window.location.origin}/career-roadmap-LUWP?roadmapId=${roadmapId}`);
                } else {
                    setCreatorError(data.error || 'Roadmap not found');
                    setCreatorState(STATES.ERROR);
                }
            })
            .catch(() => {
                setCreatorError('Failed to load roadmap');
                setCreatorState(STATES.ERROR);
            });
    }, []);

    return (
        <div className="max-w-6xl mx-auto mt-8">
            {creatorState === STATES.INPUT && (
                <RoadmapCreatorForm
                    onGenerate={handleGenerateRoadmap}
                    isLoading={creatorState === STATES.LOADING}
                    onLinkedinUrlChange={setAnalyzerUrl}
                />
            )}

            {creatorState === STATES.LOADING && (
                <LoadingAnimation
                    isReady={isDataReady}
                    onComplete={handleLoadingComplete}
                />
            )}

            {creatorState === STATES.ERROR && (
                <div className="pt-8 max-w-2xl mx-auto">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100 text-center">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">
                            Roadmap Generation Failed
                        </h2>
                        <p className="text-gray-500 mb-4">{creatorError}</p>
                        <button
                            onClick={handleCreatorReset}
                            className="px-6 py-3 btn-primary-orange text-white font-medium rounded-xl"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            )}

            {creatorState === STATES.RESULTS && roadmapResult && (
                <div className="pt-8">
                    <RoadmapPreview
                        roadmap={roadmapResult}
                        shareUrl={shareUrl}
                        onBack={handleCreatorReset}
                    />
                </div>
            )}
        </div>
    );
};

export default RoadmapCreatorPage;
