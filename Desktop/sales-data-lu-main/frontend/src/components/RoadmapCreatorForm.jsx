/**
 * RoadmapCreatorForm Component
 * Counselor input form for roadmap generation.
 */

import { useState } from 'react';

const DEFAULT_FORM = {
  linkedinUrl: '',
};

const RoadmapCreatorForm = ({ onGenerate, isLoading, onLinkedinUrlChange }) => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [resumeFile, setResumeFile] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    if (field === 'linkedinUrl') {
      onLinkedinUrlChange?.(value);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!form.linkedinUrl && !resumeFile) {
      setError('Please provide a LinkedIn URL or upload a resume');
      return;
    }

    onGenerate({
      ...form,
      resumeFile,
    });
  };

  return (
    <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Roadmap Creator (Internal Tool)
      </h2>
      <p className="text-gray-500 mb-6">
        Generate a premium, personalized roadmap page.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LinkedIn URL
            </label>
            <input
              type="text"
              value={form.linkedinUrl}
              onChange={handleChange('linkedinUrl')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              placeholder="https://www.linkedin.com/in/username"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resume Upload (PDF/DOCX)
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => {
                  setResumeFile(event.target.files?.[0] || null);
                  setError('');
                }}
                className="w-full text-sm text-gray-700 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 transition-all"
                disabled={isLoading}
              />
            </div>
            {resumeFile && (
              <p className="text-xs text-orange-600 font-medium mt-2 flex items-center">
                <span className="mr-1">✓</span> Selected: {resumeFile.name}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 italic">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Roadmap...
            </span>
          ) : 'Generate Roadmap'}
        </button>
      </form>
    </div>
  );
};

export default RoadmapCreatorForm;
