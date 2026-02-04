import { useNavigate } from 'react-router-dom';

const WelcomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
            <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-sm font-semibold tracking-wide uppercase">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    Next Gen Career Planning
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight">
                    Welcome to <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">
                        LetsUpgrade
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                    Take the next big step in your professional journey. Generate a premium,
                    AI-powered roadmap tailored specifically for your career goals.
                </p>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a
                        href="https://letsupgrade.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
                    >
                        Explore Courses
                    </a>
                </div>

                <div className="pt-12 grid grid-cols-2 md:grid-cols-3 gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-bold text-gray-800">10k+</span>
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Roadmaps Built</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-bold text-gray-800">95%</span>
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Success Rate</span>
                    </div>
                    <div className="hidden md:flex flex-col items-center">
                        <span className="text-2xl font-bold text-gray-800">24/7</span>
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">AI Support</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomePage;
