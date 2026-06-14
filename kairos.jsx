import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, Plus, Settings, Home, BookOpen, Users, Zap, Volume2, Download, Maximize2, X, ChevronDown, ArrowRight } from 'lucide-react';

export default function Kairos() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [audioMode, setAudioMode] = useState(null);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const canvasRef = useRef(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Simulate AI Orchestrator
  const loadingStages = [
    'Breaking topic into modules',
    'Searching trusted sources',
    'Cross-referencing information',
    'Building knowledge map',
    'Creating timeline',
    'Generating audio briefing'
  ];

  const handleStartDeepDive = () => {
    setShowTopicModal(true);
  };

  const generateNodes = (topicName) => {
    const newNodes = [
      { id: 1, title: 'Overview', type: 'concept', x: 0, y: 0, importance: 9 },
      { id: 2, title: 'Historical Context', type: 'concept', x: 200, y: -150, importance: 8 },
      { id: 3, title: 'Key Figures', type: 'person', x: -200, y: -150, importance: 8 },
      { id: 4, title: 'Core Principles', type: 'concept', x: 200, y: 150, importance: 7 },
      { id: 5, title: 'Timeline', type: 'timeline', x: -200, y: 150, importance: 7 },
      { id: 6, title: 'Resources', type: 'resource', x: 0, y: 300, importance: 6 },
      { id: 7, title: 'Modern Impact', type: 'concept', x: 350, y: 50, importance: 8 },
    ];
    return newNodes;
  };

  const handleSubmitTopic = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setShowTopicModal(false);
    setCurrentPage('dashboard');
    setIsLoading(true);
    setLoadingStage(0);

    // Simulate loading stages
    for (let i = 0; i < loadingStages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setLoadingStage(i + 1);
    }

    setNodes(generateNodes(topic));
    setIsLoading(false);
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const handleCanvasPan = (e) => {
    if (e.buttons === 2) { // Right mouse button
      setPanOffset(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  const handleCanvasWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(3, prev * delta)));
  };

  // Landing Page
  if (currentPage === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0D10] via-[#12161B] to-[#0B0D10] text-white overflow-hidden">
        {/* Neural Network Background */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" viewBox="0 0 1400 800">
            {[...Array(30)].map((_, i) => (
              <circle key={`particle-${i}`} cx={Math.random() * 1400} cy={Math.random() * 800} r="1.5" fill="#7C5CFF" opacity={0.6} />
            ))}
            {[...Array(15)].map((_, i) => (
              <line key={`line-${i}`} x1={Math.random() * 1400} y1={Math.random() * 800} x2={Math.random() * 1400} y2={Math.random() * 800} stroke="#00D4FF" strokeWidth="0.5" opacity="0.2" />
            ))}
          </svg>
        </div>

        <nav className="relative z-20 flex justify-between items-center px-8 py-6 border-b border-[#1a1f28]">
          <div className="text-2xl font-bold bg-gradient-to-r from-[#7C5CFF] to-[#00D4FF] bg-clip-text text-transparent">KAIROS</div>
          <button className="px-6 py-2 rounded-lg border border-[#7C5CFF] text-[#7C5CFF] hover:bg-[#7C5CFF] hover:text-white transition-all duration-300">Sign In</button>
        </nav>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center px-4">
          <div className="mb-8">
            <h1 className="text-7xl md:text-8xl font-bold mb-6 leading-tight">
              Master <span className="bg-gradient-to-r from-[#7C5CFF] to-[#00D4FF] bg-clip-text text-transparent">Anything</span>
            </h1>
            <p className="text-xl md:text-2xl text-[#A0A7B4] max-w-2xl mx-auto leading-relaxed">
              Transform any curiosity into a complete knowledge system powered by AI.
            </p>
          </div>

          <div className="flex gap-4 mt-12 flex-wrap justify-center">
            <button
              onClick={handleStartDeepDive}
              className="px-8 py-4 bg-gradient-to-r from-[#7C5CFF] to-[#5C4CFF] rounded-lg font-semibold text-white hover:shadow-lg hover:shadow-[#7C5CFF]/50 transition-all duration-300 flex items-center gap-2"
            >
              Start Deep Dive <ArrowRight size={20} />
            </button>
            <button className="px-8 py-4 border border-[#00D4FF] text-[#00D4FF] rounded-lg font-semibold hover:bg-[#00D4FF]/10 transition-all duration-300 flex items-center gap-2">
              <Play size={20} /> Watch Demo
            </button>
          </div>

          <div className="mt-20 text-[#A0A7B4] text-sm">
            <p>Powered by advanced AI orchestration</p>
            <div className="mt-4 flex gap-6 justify-center text-xs">
              <span>⚡ Instant Research</span>
              <span>🧠 Knowledge Visualization</span>
              <span>🎙️ AI Narration</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard / Knowledge Map
  return (
    <div className="h-screen w-screen flex bg-[#0B0D10] text-white">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-[#1a1f28] bg-[#12161B] overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-[#1a1f28]">
          <div className="text-xl font-bold bg-gradient-to-r from-[#7C5CFF] to-[#00D4FF] bg-clip-text text-transparent">KAIROS</div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {[
            { icon: Home, label: 'Dashboard', value: 'dashboard' },
            { icon: BookOpen, label: 'Knowledge Maps', value: 'maps' },
            { icon: Zap, label: 'Saved Topics', value: 'saved' },
            { icon: Users, label: 'Community', value: 'community' },
          ].map(item => (
            <button key={item.value} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#A0A7B4] hover:text-white hover:bg-[#1a1f28] transition-all duration-300">
              <item.icon size={18} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-4 py-6 border-t border-[#1a1f28] space-y-3">
          <div className="p-3 rounded-lg bg-gradient-to-r from-[#7C5CFF]/20 to-[#00D4FF]/20 border border-[#7C5CFF]/30">
            <p className="text-xs text-[#A0A7B4] mb-2">Current Topic</p>
            <p className="text-sm font-semibold truncate">{topic || 'No topic selected'}</p>
          </div>
          <button onClick={() => setShowTopicModal(true)} className="w-full py-2 text-sm text-[#7C5CFF] border border-[#7C5CFF] rounded-lg hover:bg-[#7C5CFF]/10 transition-all duration-300 flex items-center justify-center gap-2">
            <Plus size={16} /> New Topic
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-[#1a1f28] bg-[#12161B] px-8 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{topic || 'Knowledge Map'}</h2>
            <p className="text-xs text-[#A0A7B4]">{nodes.length} nodes • Knowledge ecosystem</p>
          </div>
          <div className="flex gap-4">
            <button className="p-2 rounded-lg text-[#A0A7B4] hover:text-white hover:bg-[#1a1f28] transition-all duration-300">
              <Maximize2 size={18} />
            </button>
            <button onClick={() => setAudioMode(audioMode ? null : 'menu')} className="p-2 rounded-lg text-[#A0A7B4] hover:text-white hover:bg-[#1a1f28] transition-all duration-300">
              <Volume2 size={18} />
            </button>
            <button className="p-2 rounded-lg text-[#A0A7B4] hover:text-white hover:bg-[#1a1f28] transition-all duration-300">
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-2 border-[#7C5CFF] border-t-[#00D4FF] animate-spin mx-auto mb-4"></div>
              <p className="text-lg font-semibold mb-2">Building your knowledge system</p>
              <p className="text-[#A0A7B4] text-sm">✓ {loadingStages[Math.min(loadingStage - 1, loadingStages.length - 1)]}</p>
              <div className="mt-4 flex gap-1 justify-center">
                {loadingStages.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i < loadingStage ? 'w-6 bg-gradient-to-r from-[#7C5CFF] to-[#00D4FF]' : 'w-2 bg-[#1a1f28]'}`}></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Canvas */}
        {!isLoading && (
          <div
            ref={canvasRef}
            className="flex-1 relative bg-gradient-to-br from-[#0B0D10] to-[#12161B] cursor-grab active:cursor-grabbing overflow-hidden"
            onMouseMove={handleCanvasPan}
            onMouseDown={(e) => e.button === 2 && e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            onWheel={handleCanvasWheel}
          >
            {/* Grid Background */}
            <svg className="absolute inset-0 w-full h-full" style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a1f28" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
              {nodes.map((node, i) => {
                if (i === 0) return null;
                const startNode = nodes[0];
                const startX = window.innerWidth / 2 + startNode.x;
                const startY = window.innerHeight / 2 + startNode.y;
                const endX = window.innerWidth / 2 + node.x;
                const endY = window.innerHeight / 2 + node.y;
                return (
                  <line key={`conn-${i}`} x1={startX} y1={startY} x2={endX} y2={endY} stroke="#7C5CFF" strokeWidth="1" opacity="0.3" />
                );
              })}
            </svg>

            {/* Nodes */}
            <div style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
              {nodes.map((node) => (
                <div
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className={`absolute w-32 p-3 rounded-lg cursor-pointer transition-all duration-300 border ${
                    selectedNode?.id === node.id
                      ? 'border-[#00D4FF] bg-[#00D4FF]/20 shadow-lg shadow-[#00D4FF]/50'
                      : 'border-[#7C5CFF] bg-[#7C5CFF]/10 hover:bg-[#7C5CFF]/20'
                  }`}
                  style={{
                    left: `calc(50vw + ${node.x}px)`,
                    top: `calc(50vh + ${node.y}px)`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="text-xs font-semibold text-[#7C5CFF] mb-1">{node.type.toUpperCase()}</div>
                  <div className="text-sm font-medium text-white truncate">{node.title}</div>
                  <div className="text-xs text-[#A0A7B4] mt-1">Importance: {node.importance}/10</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Node Details */}
      {selectedNode && !isLoading && (
        <div className="w-80 border-l border-[#1a1f28] bg-[#12161B] overflow-y-auto">
          <div className="p-6 border-b border-[#1a1f28]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-xs font-semibold text-[#7C5CFF] mb-1">{selectedNode.type.toUpperCase()}</div>
                <h3 className="text-xl font-bold">{selectedNode.title}</h3>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-[#A0A7B4] hover:text-white">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-[#A0A7B4] mb-3">Summary</h4>
              <p className="text-sm text-white leading-relaxed">
                Deep exploration of {selectedNode.title} and its role in the broader knowledge ecosystem. This node connects to multiple related concepts.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#A0A7B4] mb-3">Sources</h4>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-[#1a1f28] border border-[#2a2f38]">
                  <p className="text-xs font-medium text-white mb-1">Academic Journal</p>
                  <p className="text-xs text-[#A0A7B4]">Verified • 2024</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#A0A7B4] mb-3">Related Concepts</h4>
              <div className="space-y-2">
                {['Overview', 'Timeline', 'Key Figures'].map((concept, i) => (
                  <button key={i} className="w-full text-left p-2 rounded-lg text-sm text-[#7C5CFF] hover:bg-[#1a1f28] transition-all duration-300">
                    → {concept}
                  </button>
                ))}
              </div>
            </div>

            <button className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-[#7C5CFF] to-[#5C4CFF] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#7C5CFF]/50 transition-all duration-300">
              Expand Node
            </button>
          </div>
        </div>
      )}

      {/* Audio Companion Menu */}
      {audioMode === 'menu' && !isLoading && (
        <div className="absolute bottom-8 right-8 bg-[#12161B] border border-[#1a1f28] rounded-xl shadow-xl p-6 z-50 w-80">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Volume2 size={20} className="text-[#00D4FF]" />
            Brief Me
          </h3>
          <div className="space-y-3">
            {[
              { name: 'Quick Brief', duration: '2 minutes', icon: '⚡' },
              { name: 'Deep Brief', duration: '10 minutes', icon: '🎯' },
              { name: 'Masterclass', duration: '20+ minutes', icon: '🏆' }
            ].map((brief, i) => (
              <button key={i} className="w-full p-4 rounded-lg border border-[#1a1f28] bg-[#0B0D10] hover:bg-[#1a1f28] hover:border-[#7C5CFF] transition-all duration-300 text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-white">{brief.icon} {brief.name}</p>
                    <p className="text-xs text-[#A0A7B4]">{brief.duration}</p>
                  </div>
                  <Play size={16} className="text-[#7C5CFF]" />
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-[#A0A7B4] mt-4">AI-narrated documentary style with ambient audio</p>
        </div>
      )}

      {/* Topic Modal */}
      {showTopicModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#12161B] border border-[#1a1f28] rounded-xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-2">What do you want to master?</h2>
            <p className="text-[#A0A7B4] text-sm mb-6">Enter any topic and we'll build a complete knowledge system</p>

            <form onSubmit={handleSubmitTopic}>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Quantum Physics, Ancient Rome, True Crime..."
                className="w-full px-4 py-3 rounded-lg bg-[#0B0D10] border border-[#1a1f28] text-white placeholder-[#A0A7B4] focus:border-[#7C5CFF] focus:outline-none mb-4 transition-all duration-300"
              />

              <div className="grid grid-cols-2 gap-2 mb-6">
                {['Quantum Physics', 'Ancient Rome', 'True Crime', 'Space Exploration'].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setTopic(example)}
                    className="text-xs px-3 py-2 rounded-lg bg-[#1a1f28] text-[#A0A7B4] hover:text-white hover:border-[#7C5CFF] hover:bg-[#0B0D10] border border-[#1a1f28] transition-all duration-300"
                  >
                    {example}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowTopicModal(false)}
                  className="flex-1 py-2 rounded-lg border border-[#1a1f28] text-[#A0A7B4] hover:text-white transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!topic.trim()}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-[#7C5CFF] to-[#5C4CFF] text-white font-semibold hover:shadow-lg hover:shadow-[#7C5CFF]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  Start Deep Dive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
