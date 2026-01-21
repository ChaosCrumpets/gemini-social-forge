// CINEMITOGRAPHY PANEL - DO NOT DELETE THIS FILE
// This is a temporary file containing the CinematographyPanel component
// It will be inserted into OutputPanels.tsx at line 458

function CinematographyPanel({ cinematography }: { cinematography?: Cinematography }) {
    if (!cinematography) {
        return (
            <div className="p-8 text-center">
                <p className="text-yellow-600 font-semibold mb-2">⚠️ Cinematography Data Not Available</p>
                <p className="text-sm text-gray-600">The AI did not return cinematography data.</p>
            </div>
        );
    }

    const { techSpecs, storyboard } = cinematography;

    return (
        <div className="space-y-8 p-6" data-testid="panel-cinematography">
            <section>
                <h3 className="text-xl font-bold mb-4 border-b-2 border-gray-300 pb-2">
                    📹 Technical Specifications
                </h3>

                {techSpecs ? (
                    <div className="space-y-6">
                        {techSpecs.cameraVideo && techSpecs.cameraVideo.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-sm mb-3 text-gray-800 flex items-center">
                                    <span className="mr-2">🎥</span>
                                    Camera & Video
                                </h4>
                                <ul className="space-y-1.5 text-sm">
                                    {techSpecs.cameraVideo.map((spec: string, idx: number) => (
                                        <li key={idx} className="text-gray-700 pl-4">{spec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {techSpecs.audio && techSpecs.audio.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-sm mb-3 text-gray-800 flex items-center">
                                    <span className="mr-2">🎤</span>
                                    Audio
                                </h4>
                                <ul className="space-y-1.5 text-sm">
                                    {techSpecs.audio.map((spec: string, idx: number) => (
                                        <li key={idx} className="text-gray-700 pl-4">{spec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {techSpecs.lighting && techSpecs.lighting.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-sm mb-3 text-gray-800 flex items-center">
                                    <span className="mr-2">💡</span>
                                    Lighting
                                </h4>
                                <ul className="space-y-1.5 text-sm">
                                    {techSpecs.lighting.map((spec: string, idx: number) => (
                                        <li key={idx} className="text-gray-700 pl-4">{spec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {techSpecs.platformOptimizations && techSpecs.platformOptimizations.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-sm mb-3 text-gray-800 flex items-center">
                                    <span className="mr-2">📱</span>
                                    Platform Optimizations
                                </h4>
                                <ul className="space-y-1.5 text-sm">
                                    {techSpecs.platformOptimizations.map((spec: string, idx: number) => (
                                        <li key={idx} className="text-gray-700 pl-4">{spec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {techSpecs.exportSettings && techSpecs.exportSettings.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-sm mb-3 text-gray-800 flex items-center">
                                    <span className="mr-2">⚙️</span>
                                    Export Settings
                                </h4>
                                <ul className="space-y-1.5 text-sm">
                                    {techSpecs.exportSettings.map((spec: string, idx: number) => (
                                        <li key={idx} className="text-gray-700 pl-4">{spec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-gray-500 italic text-sm">No technical specifications available</p>
                )}
            </section>

            <section>
                <h3 className="text-xl font-bold mb-4 border-b-2 border-gray-300 pb-2">
                    🎬 Storyboard
                </h3>

                {storyboard && storyboard.length > 0 ? (
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-100 border-b-2 border-gray-300">
                                    <th className="p-3 text-left font-semibold text-gray-800 border-r border-gray-300">Frame #</th>
                                    <th className="p-3 text-left font-semibold text-gray-800 border-r border-gray-300">Timing</th>
                                    <th className="p-3 text-left font-semibold text-gray-800 border-r border-gray-300">Shot Type</th>
                                    <th className="p-3 text-left font-semibold text-gray-800 border-r border-gray-300">Visual Description</th>
                                    <th className="p-3 text-left font-semibold text-gray-800 border-r border-gray-300">Camera Movement</th>
                                    <th className="p-3 text-left font-semibold text-gray-800 border-r border-gray-300">Audio/VO</th>
                                    <th className="p-3 text-left font-semibold text-gray-800 border-r border-gray-300">Transition</th>
                                    <th className="p-3 text-left font-semibold text-gray-800">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {storyboard.map((frame: any, idx: number) => (
                                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                        <td className="p-3 font-mono text-gray-600 font-semibold border-r border-gray-200">{frame.frameNumber || idx + 1}</td>
                                        <td className="p-3 text-gray-700 whitespace-nowrap border-r border-gray-200">{frame.timing || 'N/A'}</td>
                                        <td className="p-3 text-gray-700 font-semibold text-xs uppercase border-r border-gray-200">{frame.shotType || 'N/A'}</td>
                                        <td className="p-3 text-gray-700 border-r border-gray-200">{frame.visualDescription || 'No description'}</td>
                                        <td className="p-3 text-gray-700 text-xs uppercase border-r border-gray-200">{frame.cameraMovement || 'STATIC'}</td>
                                        <td className="p-3 text-gray-700 italic border-r border-gray-200">{frame.audioVO || '—'}</td>
                                        <td className="p-3 text-gray-700 uppercase text-xs font-semibold border-r border-gray-200">{frame.transition || 'CUT'}</td>
                                        <td className="p-3 text-gray-600 text-xs">{frame.notes || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500 italic text-sm">No storyboard data available</p>
                )}
            </section>
        </div>
    );
}
