/**
 * RoadmapPreview Component
 * Renders counselor-focused roadmap output.
 */

const ProgressMeter = ({ percent }) => (
  <div className="w-full">
    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
      <span>Readiness</span>
      <span className="font-semibold text-gray-800">{percent}%</span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400"
        style={{ width: `${percent}%` }}
      />
    </div>
  </div>
);

const RoadmapPreview = ({ roadmap, shareUrl }) => {
  if (!roadmap) return null;

  const { profile, snapshot, currentState, nextRoles, courseFitment, projectsOutcome, closing } =
    roadmap;
  const readinessPercent = Math.round(snapshot?.readinessPercent || 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-orange-500 font-semibold">
              Snapshot
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mt-2">
              {profile?.name || 'Candidate'}
            </h2>
            <p className="text-gray-500 mt-1">{profile?.headline}</p>
          </div>
          <div className="w-full md:max-w-xs">
            <ProgressMeter percent={readinessPercent} />
            <p className="text-xs text-gray-500 mt-2">{snapshot?.confidenceLine}</p>
          </div>
        </div>
        <p className="text-gray-700 mt-4">{snapshot?.whereYouStand}</p>
        <div className="mt-4 bg-orange-50 border border-orange-100 text-orange-700 rounded-xl px-4 py-3 text-sm font-medium">
          {snapshot?.ctaLine}
        </div>
        {shareUrl && (
          <div className="mt-4 text-sm text-gray-500">
            Shareable link: <span className="text-orange-600">{shareUrl}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Current State</h3>
        <p className="text-sm text-gray-600 mb-4">{currentState?.role}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-800 mb-2">Tools</p>
            <div className="flex flex-wrap gap-2">
              {(currentState?.skillsByCategory?.tools || []).map((item, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-xs font-medium border border-orange-100"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-800 mb-2">Concepts</p>
            <div className="flex flex-wrap gap-2">
              {(currentState?.skillsByCategory?.concepts || []).map((item, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-xs font-medium border border-orange-100"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-800 mb-2">Projects</p>
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
              {(currentState?.skillsByCategory?.projects || []).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-800 mb-2">Soft Skills</p>
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
              {(currentState?.skillsByCategory?.softSkills || []).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 mt-4">
          <div className="border border-gray-100 rounded-xl p-4 bg-green-50">
            <p className="text-sm font-semibold text-green-700 mb-2">Top Strengths</p>
            <ul className="text-sm text-green-700 list-disc list-inside space-y-1">
              {(currentState?.strengths || []).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="border border-gray-100 rounded-xl p-4 bg-amber-50">
            <p className="text-sm font-semibold text-amber-700 mb-2">Top Gaps</p>
            <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
              {(currentState?.gaps || []).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Next Roles</h3>
        <div className="space-y-4">
          {(nextRoles || []).map((role, idx) => (
            <div key={idx} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-semibold text-gray-800">{role.role}</h4>
                <span className="text-md font-bold text-gray-800">
                  {role.salaryRange?.entry} – {role.salaryRange?.mid} LPA
                </span>
              </div>

              {role.description && (
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">{role.description}</p>
              )}

              <p className="text-sm text-gray-700 mt-3 font-medium">{role.whyFit}</p>

              {role.companies && role.companies.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">Companies hiring for this role:</p>
                  <div className="flex flex-wrap gap-2">
                    {role.companies.map((company, companyIdx) => (
                      <span
                        key={companyIdx}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100"
                      >
                        {company}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3">
                <p className="text-xs text-gray-500">Missing skills:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(role.missingSkills || []).map((item, skillIdx) => (
                    <span
                      key={skillIdx}
                      className="px-3 py-1 text-xs bg-gray-100 text-black-600 rounded-full"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-black-400 mt-2">{role.salaryRange?.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Course Curriculum (12 Weeks)</h3>
        <div className="space-y-4">
          {(courseFitment?.phases || []).map((phase, idx) => (
            <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-slate-50">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-semibold text-gray-800">{phase.title}</h4>
                <span className="text-xs text-gray-500">{phase.weeks}</span>
              </div>
              <div className="grid gap-3 md:grid-cols-3 mt-3">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Learn</p>
                  <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                    {(phase.learn || []).map((item, idy) => (
                      <li key={idy}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Closes Gaps</p>
                  <div className="flex flex-wrap gap-2">
                    {(phase.closesGaps || []).map((item, idy) => (
                      <span
                        key={idy}
                        className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Outputs</p>
                  <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                    {(phase.outputs || []).map((item, idy) => (
                      <li key={idy}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Projects Outcome</h3>
        <p className="text-sm text-gray-600 mb-2">{projectsOutcome?.totalProjects}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Project Types</p>
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
              {(projectsOutcome?.examples || []).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">How to Showcase</p>
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
              {(projectsOutcome?.showcase || []).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 border border-orange-100">
        <h3 className="text-lg font-semibold text-orange-700 mb-2">Closing</h3>
        <p className="text-sm text-gray-600 mb-2">{closing?.ifNothing}</p>
        <p className="text-sm text-gray-700 mb-2">{closing?.ifComplete}</p>
        <p className="text-sm text-orange-700 font-semibold mb-3">
          {closing?.deltaPotential}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://pages.razorpay.com/pl_S7Hmm9y3KCV723/view"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 btn-primary-orange text-white font-semibold rounded-xl text-center flex-1"
          >
            Enroll now
          </a>
          <a
            href="/brochure.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 btn-secondary-orange font-semibold rounded-xl text-center flex-1"
          >
            Get Brochure
          </a>
        </div>
      </div>
    </div>
  );
};

export default RoadmapPreview;
