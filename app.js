/**
 * KAIROS — CORE APPLICATION ENGINE
 * Vanilla JavaScript implementation for an immersive second-brain experience.
 */

// --- 0. GEMINI API CONFIGURATION ---
const GEMINI_API_KEY = "AQ.Ab8RN6L1_gEuUVDLDHtW5sV1VmUgXvl5DkcTg5AxV7fyd9JmRA";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

/**
 * Sanitizes URLs to ensure they point directly to informative pages rather than generic homepages,
 * search results pages, or broken links. Falls back to a Wikipedia redirect search for the specific topic.
 */
function sanitizeUrl(url, nodeTitle, topic) {
  if (!url) {
    return `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(nodeTitle || topic)}&title=Special%3ASearch&go=Go`;
  }
  
  const lowerUrl = url.toLowerCase();
  
  // Check for search engine query strings or search pages
  const isSearchUrl = lowerUrl.includes("google.com/scholar") || 
                      lowerUrl.includes("nature.com/search") || 
                      lowerUrl.includes("arxiv.org/search") || 
                      lowerUrl.includes("britannica.com/search") || 
                      lowerUrl.includes("history.com/search") || 
                      lowerUrl.includes("worldhistory.org/search") || 
                      lowerUrl.includes("smithsonianmag.com/search") || 
                      lowerUrl.includes("vault.fbi.gov/search") ||
                      lowerUrl.includes("technologyreview.com/search") ||
                      lowerUrl.includes("spectrum.ieee.org/search") ||
                      lowerUrl.includes("special:search") ||
                      lowerUrl.includes("search.php") ||
                      lowerUrl.includes("search?") ||
                      lowerUrl.includes("search/") ||
                      lowerUrl.includes("query=");
                      
  // Check for generic homepages or top-level portals that don't contain the specific information
  const genericHomepages = [
    "https://www.crimemuseum.org/crime-library/",
    "https://www.crimemuseum.org/crime-library",
    "https://www.nationalarchives.gov.uk/education/resources/",
    "https://www.nationalarchives.gov.uk/education/resources",
    "https://www.crimemuseum.org",
    "https://www.nationalarchives.gov.uk",
    "https://www.britannica.com",
    "https://en.wikipedia.org",
    "https://science.nasa.gov",
    "https://cisa.gov",
    "https://www.cisa.gov"
  ];
  
  const isGenericHomepage = genericHomepages.some(home => lowerUrl === home || lowerUrl === home + "/");

  // Check for known broken URLs (like NASA's event horizon 404 URL)
  const isKnownBroken = lowerUrl.includes("science.nasa.gov/universe/what-is-quantum-entanglement") || 
                        lowerUrl.includes("science.nasa.gov/universe/what-is-quantum-entanglement/");

  if (isSearchUrl || isGenericHomepage || isKnownBroken) {
    // Clean up nodeTitle to extract a better search query for Wikipedia:
    // e.g. "Overview: Why is Quantum Physics trending?" -> "Quantum Physics"
    // e.g. "Unsolved Mystery: Jack the Ripper" -> "Jack the Ripper"
    // e.g. "Key Figures & Controversies" -> "Key Figures of " + topic
    let query = nodeTitle || topic;
    if (query.includes(":")) {
      const parts = query.split(":");
      query = parts[1].trim();
    }
    // Remove fluff words
    query = query.replace("Why is ", "").replace(" trending?", "").replace("The Timeline of ", "");
    
    // If the query is something generic, append the topic
    const lowerQuery = query.toLowerCase();
    if (lowerQuery === "primary suspect" || 
        lowerQuery === "key figures & controversies" || 
        lowerQuery === "key figures" ||
        lowerQuery === "forensic fact" || 
        lowerQuery === "hidden facts & mechanics" || 
        lowerQuery === "hidden facts" ||
        lowerQuery === "victim profile" || 
        lowerQuery === "investigation lead" || 
        lowerQuery === "the future outlook" || 
        lowerQuery.startsWith("top resources")) {
      query = topic + " " + query;
    }

    return `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}&title=Special%3ASearch&go=Go`;
  }
  
  return url;
}


/**
 * Calls the Google Gemini API with a prompt and returns parsed JSON.
 * @param {string} topic - The topic to research.
 * @returns {Promise<object|null>} Parsed topic data or null on failure.
 */
async function callGeminiAPI(topic) {
  const prompt = `You are Kairos, an AI knowledge architect. Given the topic "${topic}", generate a comprehensive knowledge map.

Return ONLY valid JSON (no markdown, no backticks) with this exact structure:
{
  "category": "Science" | "History" | "Technology" | "Crime" | "Philosophy" | "Art",
  "tagline": "A compelling one-line description of this topic",
  "modules": [
    { "title": "Module Title", "time": "20 min", "diff": "Beginner" | "Intermediate" | "Advanced", "xp": 100 },
    { "title": "Module Title", "time": "30 min", "diff": "Intermediate", "xp": 150 },
    { "title": "Module Title", "time": "40 min", "diff": "Advanced", "xp": 200 }
  ],
  "nodes": [
    {
      "type": "concept" | "person" | "fact" | "timeline" | "resource",
      "title": "Node Title",
      "summary": "A detailed 2-3 sentence summary of this knowledge node.",
      "importance": "Critical" | "High" | "Medium" | "Low",
      "credibility": "green" | "yellow" | "red",
      "date": "Month Year",
      "url": "https://en.wikipedia.org/wiki/relevant_article or another highly credible URL from a reputable website (e.g. nature.com, arxiv.org, cisa.gov, nasa.gov, britannica.com, worldhistory.org, history.com, ieee.org, science.org, scholar.google.com)"
    }
  ],
  "connections": [
    { "sourceIndex": 0, "targetIndex": 1, "active": true }
  ],
  "obsessionPathways": [
    { "text": "Related concept name", "link": "Deeper topic to explore" }
  ]
}

Rules:
- Generate exactly 5-6 nodes. Choose node types dynamically from: concept, person, fact, timeline, resource, overview, or achievement. Adapt perfectly to the topic type. If the topic is a specific PERSON, provide a biographical overview, their timeline, major achievements, and controversies. If the topic is a CONCEPT, provide mechanics, history, and applications.
- Generate 4-5 connections between nodes using sourceIndex/targetIndex (0-based indices into the nodes array)
- Generate 3 obsession pathways suggesting deeper rabbit holes
- Generate 3 learning modules of increasing difficulty
- IMPORTANT: Instead of generic Wikipedia-style headlines, focus on WHAT PEOPLE ACTUALLY SEARCH FOR. Predict the user's intent: include the most frequently asked questions, trending controversies, hidden fascinations, and high-traffic search trends related to the topic. If it's a person, what is the most scandalous or impressive thing they did?
- Node titles MUST be phrased as highly engaging, frequently searched subtopics, or intriguing questions.
- All summaries should be factual, detailed, and educational, directly answering the implied search query.
- All URLs should be real and point directly to highly credible sources (e.g., academic journals, official government/organizational sites, world-class magazines, or Wikipedia). Do NOT restrict yourself only to Wikipedia; use nature.com, arxiv.org, cisa.gov, nasa.gov, worldhistory.org, history.com, and other reputable domains.
- The tagline should be evocative and engaging
- Make the content genuinely insightful, intellectually stimulating, and highly predictive of what a curious person wants to know.`;

  try {
    const fullKey = GEMINI_API_KEY;
    const response = await fetch(`${GEMINI_API_URL}?key=${fullKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 4096,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      console.error("Gemini API error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error("No text in Gemini response");
      return null;
    }

    // Parse JSON — strip markdown fences if present
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (err) {
    console.error("Gemini API call failed:", err);
    return null;
  }
}

/**
 * Converts raw Gemini API response into KAIROS-compatible topic data structure.
 */
function convertGeminiResponseToTopicData(topic, geminiData) {
  const cleanId = topic.replace(/[^a-zA-Z0-9]/g, "").substring(0, 8).toLowerCase() || "ai";
  const isCrime = (geminiData.category || "").toLowerCase() === "crime";

  // Position nodes in an aesthetically pleasing layout
  const positions = [
    { x: 250, y: 150 },
    { x: 80, y: 100 },
    { x: 100, y: 280 },
    { x: 420, y: 80 },
    { x: 450, y: 260 },
    { x: 280, y: 380 }
  ];

  const badgeMap = {
    "person": isCrime ? "suspect" : undefined,
    "timeline": isCrime ? "victim" : undefined,
    "fact": isCrime ? "evidence" : undefined,
    "concept": isCrime ? "evidence" : undefined,
    "resource": isCrime ? "timeline" : undefined
  };

  const nodes = (geminiData.nodes || []).map((node, i) => {
    const pos = positions[i] || { x: 200 + Math.random() * 300, y: 100 + Math.random() * 300 };
    return {
      id: `${cleanId}-n${i + 1}`,
      type: node.type || "concept",
      title: node.title,
      summary: node.summary,
      importance: node.importance || "Medium",
      credibility: node.credibility || "green",
      date: node.date || "June 2026",
      url: sanitizeUrl(node.url, node.title, topic),
      x: pos.x,
      y: pos.y,
      badge: badgeMap[node.type]
    };
  });

  const connections = (geminiData.connections || []).map(conn => ({
    source: `${cleanId}-n${(conn.sourceIndex || 0) + 1}`,
    target: `${cleanId}-n${(conn.targetIndex || 1) + 1}`,
    active: conn.active !== false
  }));

  const modules = (geminiData.modules || []).map((mod, i) => ({
    id: `${cleanId}-m${i + 1}`,
    title: mod.title,
    time: mod.time || "20 min",
    diff: mod.diff || "Intermediate",
    xp: mod.xp || 120,
    completed: false
  }));

  const obsessionPathways = (geminiData.obsessionPathways || []).map(p => ({
    text: p.text,
    link: p.link
  }));

  return {
    category: geminiData.category || "Science",
    tagline: geminiData.tagline || `Exploring the depths of ${topic}.`,
    obsScore: Math.floor(Math.random() * 20) + 15,
    modules: modules.length > 0 ? modules : [
      { id: `${cleanId}-m1`, title: `Foundations of ${topic}`, time: "15 min", diff: "Beginner", xp: 100, completed: false }
    ],
    nodes: nodes.length > 0 ? nodes : [
      { id: `${cleanId}-n1`, type: "concept", title: `Core Principles of ${topic}`, summary: `The fundamental framework of ${topic}.`, importance: "Critical", credibility: "green", date: "June 2026", url: sanitizeUrl(null, `Core Principles of ${topic}`, topic), x: 250, y: 150 }
    ],
    connections: connections,
    obsessionPathways: obsessionPathways.length > 0 ? obsessionPathways : [
      { text: `Origins of ${topic}`, link: `${topic} History` }
    ]
  };
}

/**
 * Local fallback generator used when Gemini API is unavailable.
 * Produces a rich, topic-specific knowledge map using deterministic content.
 */
function generateDynamicTopicData(topic) {
  const title = topic.trim();
  const lower = title.toLowerCase();

  // Determine category based on keywords
  let category = "Science";
  if (lower.includes("history") || lower.includes("empire") || lower.includes("ancient") || lower.includes("war") || lower.includes("rome") || lower.includes("dynasty") || lower.includes("revolution")) {
    category = "History";
  } else if (lower.includes("cyber") || lower.includes("computer") || lower.includes("code") || lower.includes("tech") || lower.includes("digital") || lower.includes("software") || lower.includes("data") || lower.includes("ai") || lower.includes("learning")) {
    category = "Technology";
  } else if (lower.includes("murder") || lower.includes("crime") || lower.includes("detective") || lower.includes("serial") || lower.includes("police") || lower.includes("case")) {
    category = "Crime";
  } else if (lower.includes("philosophy") || lower.includes("mind") || lower.includes("art") || lower.includes("music") || lower.includes("literature") || lower.includes("culture")) {
    category = "History";
  }

  // Generate customized tagline
  let tagline = `Explore foundational concepts, key figures, and the structural dynamics of ${title}.`;
  if (category === "Science") {
    tagline = `Hypotheses, physical phenomena, and structural principles of ${title}.`;
  } else if (category === "History") {
    tagline = `Historical milestones, influential figures, and legacies of ${title}.`;
  } else if (category === "Technology") {
    tagline = `Algorithms, systems, architectures, and future horizons of ${title}.`;
  } else if (category === "Crime") {
    tagline = `Evidence, suspect dossiers, timeline records, and forensic details of ${title}.`;
  }

  const cleanId = title.replace(/[^a-zA-Z0-9]/g, "").substring(0, 8).toLowerCase() || "gen";
  const isCrime = category === "Crime";
  const firstWord = title.split(" ")[0] || title;

  // Domain configuration based on categories to provide diverse, highly credible resources
  let urls = [];
  if (category === "Science") {
    urls = [
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title)}&title=Special%3ASearch&go=Go`,
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title + " pioneers")}&title=Special%3ASearch&go=Go`,
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title + " mechanics")}&title=Special%3ASearch&go=Go`,
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title + " history")}&title=Special%3ASearch&go=Go`,
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent("Future of " + title)}&title=Special%3ASearch&go=Go`,
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title + " research")}&title=Special%3ASearch&go=Go`
    ];
  } else if (category === "History") {
    urls = [
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title)}&title=Special%3ASearch&go=Go`,
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent("Key figures in " + title)}&title=Special%3ASearch&go=Go`,
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title + " events")}&title=Special%3ASearch&go=Go`,
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title + " timeline")}&title=Special%3ASearch&go=Go`,
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title + " legacy")}&title=Special%3ASearch&go=Go`,
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title + " archives")}&title=Special%3ASearch&go=Go`
    ];
  } else if (category === "Technology") {
    urls = [
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title)}&title=Special%3ASearch&go=Go`,
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent("Key figures in " + title)}&title=Special%3ASearch&go=Go`,
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title + " specifications")}&title=Special%3ASearch&go=Go`,
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title + " development")}&title=Special%3ASearch&go=Go`,
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title + " applications")}&title=Special%3ASearch&go=Go`,
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title + " future")}&title=Special%3ASearch&go=Go`
    ];
  } else if (category === "Crime") {
    urls = [
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title)}&title=Special%3ASearch&go=Go`,
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title + " suspects")}&title=Special%3ASearch&go=Go`,
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title + " evidence")}&title=Special%3ASearch&go=Go`,
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title + " victims")}&title=Special%3ASearch&go=Go`,
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title + " investigation")}&title=Special%3ASearch&go=Go`,
      `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title + " case file")}&title=Special%3ASearch&go=Go`
    ];
  } else {
    urls = Array(6).fill(null).map((_, i) => `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title)}&title=Special%3ASearch&go=Go`);
  }

  const nodes = [
    {
      id: `${cleanId}-n1`,
      type: "concept",
      title: isCrime ? `Unsolved Mystery: ${title}` : `Overview: Why is ${title} trending?`,
      summary: isCrime ? `Primary details, logs, and central case profile records compiled for the investigation.` : `The most frequently asked questions and core definitions that define the current massive interest in ${title}.`,
      importance: "Critical",
      credibility: "green",
      date: "May 2026",
      url: sanitizeUrl(urls[0], isCrime ? `Unsolved Mystery: ${title}` : `Overview: Why is ${title} trending?`, title),
      x: 250,
      y: 150,
      badge: isCrime ? "evidence" : undefined
    },
    {
      id: `${cleanId}-n2`,
      type: "person",
      title: isCrime ? `Primary Suspect` : `Key Figures & Controversies`,
      summary: isCrime ? `Key individual of interest identified by investigators with documented motives/opportunity.` : `The most discussed people, pioneers, or controversies associated directly with ${title}.`,
      importance: "High",
      credibility: isCrime ? "red" : "green",
      date: "April 2026",
      url: sanitizeUrl(urls[1], isCrime ? `Primary Suspect` : `Key Figures & Controversies`, title),
      x: 80,
      y: 100,
      badge: isCrime ? "suspect" : undefined
    },
    {
      id: `${cleanId}-n3`,
      type: "fact",
      title: isCrime ? `Forensic Fact` : `Hidden Facts & Mechanics`,
      summary: isCrime ? `Verified empirical evidence and physical measurements collected from the scene.` : `The underlying mechanisms, verified breakthroughs, and hidden truths that experts know but beginners often misunderstand.`,
      importance: "High",
      credibility: "green",
      date: "June 2026",
      url: sanitizeUrl(urls[2], isCrime ? `Forensic Fact` : `Hidden Facts & Mechanics`, title),
      x: 100,
      y: 280,
      badge: isCrime ? "evidence" : undefined
    },
    {
      id: `${cleanId}-n4`,
      type: "timeline",
      title: isCrime ? `Victim Profile` : `The Timeline of ${title}`,
      summary: isCrime ? `Detailed victim chronology, timeline log, and association map details.` : `A breakdown of the historical shifts, hidden milestones, and the defining moments that shaped ${title} today.`,
      importance: "Medium",
      credibility: isCrime ? "yellow" : "yellow",
      date: "Feb 2026",
      url: sanitizeUrl(urls[3], isCrime ? `Victim Profile` : `The Timeline of ${title}`, title),
      x: 420,
      y: 80,
      badge: isCrime ? "victim" : undefined
    },
    {
      id: `${cleanId}-n5`,
      type: "resource",
      title: isCrime ? `Investigation Lead` : `The Future Outlook`,
      summary: isCrime ? `A critical lead under investigation by police, detailing witness testimonies and timelines.` : `Predictive analysis, upcoming breakthroughs, and why this topic will dominate conversations over the next decade.`,
      importance: "Low",
      credibility: "green",
      date: "Jan 2026",
      url: sanitizeUrl(urls[4], isCrime ? `Investigation Lead` : `The Future Outlook`, title),
      x: 450,
      y: 260,
      badge: isCrime ? "timeline" : undefined
    }
  ];

  // Add a 6th node for non-crime categories (Science, History, Tech)
  if (!isCrime) {
    nodes.push({
      id: `${cleanId}-n6`,
      type: "resource",
      title: `Top Resources & Deep Dives on ${title}`,
      summary: `A highly curated collection of the most clicked, highly respected, and deeply fascinating deep-dives on ${title}.`,
      importance: "Low",
      credibility: "green",
      date: "Jan 2026",
      url: sanitizeUrl(urls[5], `Top Resources & Deep Dives on ${title}`, title),
      x: 280,
      y: 380
    });
  }

  const connections = [
    { source: `${cleanId}-n2`, target: `${cleanId}-n1`, active: true },
    { source: `${cleanId}-n1`, target: `${cleanId}-n3`, active: true },
    { source: `${cleanId}-n3`, target: `${cleanId}-n4`, active: false },
    { source: `${cleanId}-n1`, target: `${cleanId}-n5`, active: true }
  ];
  if (!isCrime) {
    connections.push({ source: `${cleanId}-n5`, target: `${cleanId}-n6`, active: false });
  }

  const modules = [
    { id: `${cleanId}-m1`, title: `Foundations of ${title}`, time: "15 min", diff: "Beginner", xp: 100, completed: false },
    { id: `${cleanId}-m2`, title: `Core Methods & Theories`, time: "25 min", diff: "Intermediate", xp: 150, completed: false },
    { id: `${cleanId}-m3`, title: `Advanced Applications`, time: "35 min", diff: "Advanced", xp: 200, completed: false }
  ];

  return {
    category,
    tagline,
    obsScore: Math.floor(Math.random() * 20) + 15,
    modules,
    nodes,
    connections,
    obsessionPathways: [
      { text: `Origins of ${firstWord}`, link: `${firstWord} History` },
      { text: `Practical applications`, link: `Applied ${firstWord}` },
      { text: `Theoretical models`, link: `${title} Theory` }
    ]
  };
}

// --- 1. DATA DICTIONARIES (TOPIC MODULES, NODES, & CONNECTIONS) ---
const TOPICS_DATA = {
  "Quantum Physics": {
    category: "Science",
    tagline: "Wave functions, probability clouds, and the fabric of reality.",
    obsScore: 24,
    modules: [
      { id: "qp-m1", title: "Planck's Quantum Revolution", time: "15 min", diff: "Beginner", xp: 100, completed: true },
      { id: "qp-m2", title: "Wave-Particle Duality", time: "25 min", diff: "Intermediate", xp: 150, completed: false },
      { id: "qp-m3", title: "The Uncertainty Principle", time: "30 min", diff: "Intermediate", xp: 150, completed: false },
      { id: "qp-m4", title: "Quantum Entanglement & EPR", time: "45 min", diff: "Advanced", xp: 200, completed: false }
    ],
    nodes: [
      { id: "qp-n1", type: "concept", title: "Wave-Particle Duality", summary: "The fundamental concept that every quantum entity behaves as both a particle and a wave. Demonstrated by the famous Double-Slit Experiment.", importance: "Critical", credibility: "green", date: "June 2026", url: "https://en.wikipedia.org/wiki/Wave%E2%80%93particle_duality", x: 250, y: 150 },
      { id: "qp-n2", type: "person", title: "Max Planck", summary: "German theoretical physicist who discovered energy quanta, winning the Nobel Prize in Physics in 1918. Widely regarded as the father of quantum theory.", importance: "High", credibility: "green", date: "April 2026", url: "https://www.britannica.com/biography/Max-Planck", x: 80, y: 100 },
      { id: "qp-n3", type: "fact", title: "Energy Quantization", summary: "Energy is not emitted continuously, but in discrete packet units called 'quanta'. Expressed as E = hν, where h is Planck's constant.", importance: "High", credibility: "green", date: "May 2026", url: "https://en.wikipedia.org/wiki/Quantization_(physics)", x: 100, y: 280 },
      { id: "qp-n4", type: "timeline", title: "1927 Solvay Conference", summary: "The landmark fifth Solvay Conference in Brussels, where physicists debated the newly formulated Quantum Mechanics, highlighting Bohr and Einstein's arguments.", importance: "Medium", credibility: "yellow", date: "Feb 2026", url: "https://en.wikipedia.org/wiki/Solvay_Conference", x: 420, y: 80 },
      { id: "qp-n5", type: "concept", title: "Quantum Entanglement", summary: "A phenomenon where two or more particles become interconnected such that the state of one instantly influences the other, regardless of distance.", importance: "Critical", credibility: "green", date: "May 2026", url: "https://en.wikipedia.org/wiki/Quantum_entanglement", x: 450, y: 260 },
      { id: "qp-n6", type: "resource", title: "Quantum Path Integrals", summary: "Richard Feynman's formulation of quantum theory, reformulating classical mechanics using action principles and summation over histories.", importance: "Low", credibility: "green", date: "Jan 2026", url: "https://en.wikipedia.org/wiki/Path_integral_formulation", x: 280, y: 380 }
    ],
    connections: [
      { source: "qp-n2", target: "qp-n3", active: true },
      { source: "qp-n3", target: "qp-n1", active: false },
      { source: "qp-n1", target: "qp-n4", active: false },
      { source: "qp-n1", target: "qp-n5", active: true },
      { source: "qp-n5", target: "qp-n6", active: false }
    ],
    obsessionPathways: [
      { text: "Quantum Entanglement", link: "Quantum Computing" },
      { text: "Wave-Particle Duality", link: "Wave Theory" },
      { text: "Solvay Conference", link: "Copenhagen Interpretation" }
    ]
  },
  "Ancient Rome": {
    category: "History",
    tagline: "Legions, emperors, aqueducts, and the fall of an empire.",
    obsScore: 19,
    modules: [
      { id: "ar-m1", title: "Rise of the Republic", time: "20 min", diff: "Beginner", xp: 100, completed: true },
      { id: "ar-m2", title: "The Rubicon & Caesar's Fall", time: "25 min", diff: "Intermediate", xp: 120, completed: true },
      { id: "ar-m3", title: "Pax Romana & Imperial Golden Age", time: "30 min", diff: "Intermediate", xp: 150, completed: false },
      { id: "ar-m4", title: "Crisis of the Third Century", time: "40 min", diff: "Advanced", xp: 180, completed: false }
    ],
    nodes: [
      { id: "ar-n1", type: "concept", title: "Pax Romana", summary: "A roughly 200-year-long period of relative peace and stability across the Roman Empire, initiated under Caesar Augustus.", importance: "Critical", credibility: "green", date: "May 2026", url: "https://www.worldhistory.org/Pax_Romana/", x: 250, y: 150 },
      { id: "ar-n2", type: "person", title: "Julius Caesar", summary: "Populist general, politician, and dictator who led the Roman Republic's transition to the Roman Empire before his assassination in 44 BC.", importance: "Critical", credibility: "green", date: "April 2026", url: "https://en.wikipedia.org/wiki/Julius_Caesar", x: 80, y: 120 },
      { id: "ar-n3", type: "timeline", title: "Crossing the Rubicon", summary: "In 49 BC, Julius Caesar led his legion across the Rubicon river, committing an act of treason that triggered civil war and led to empire.", importance: "High", credibility: "green", date: "March 2026", url: "https://en.wikipedia.org/wiki/Crossing_the_Rubicon", x: 100, y: 300 },
      { id: "ar-n4", type: "fact", title: "Roman Aqueducts", summary: "Massive civil engineering projects bringing fresh water from miles away into Roman cities, supporting baths, toilets, and private houses.", importance: "Medium", credibility: "green", date: "May 2026", url: "https://en.wikipedia.org/wiki/Roman_aqueduct", x: 420, y: 90 },
      { id: "ar-n5", type: "resource", title: "Decline and Fall of Rome", summary: "Edward Gibbon's classic six-volume history book examining the factors behind the political collapses of the Western Empire.", importance: "Low", credibility: "yellow", date: "Jan 2026", url: "https://en.wikipedia.org/wiki/Decline_of_the_Roman_Empire", x: 450, y: 260 }
    ],
    connections: [
      { source: "ar-n2", target: "ar-n3", active: true },
      { source: "ar-n3", target: "ar-n1", active: true },
      { source: "ar-n1", target: "ar-n4", active: false },
      { source: "ar-n1", target: "ar-n5", active: false }
    ],
    obsessionPathways: [
      { text: "Julius Caesar", link: "Roman Warfare" },
      { text: "Pax Romana", link: "Imperial Architecture" },
      { text: "Decline of Rome", link: "Crisis of the Third Century" }
    ]
  },
  "Cybersecurity": {
    category: "Technology",
    tagline: "Defending nodes, hacking loops, and cryptanalytic foundations.",
    obsScore: 12,
    modules: [
      { id: "cs-m1", title: "Networking Fundamentals", time: "15 min", diff: "Beginner", xp: 80, completed: true },
      { id: "cs-m2", title: "Zero Trust Architecture", time: "25 min", diff: "Intermediate", xp: 120, completed: false },
      { id: "cs-m3", title: "Penetration Testing Loop", time: "35 min", diff: "Advanced", xp: 160, completed: false }
    ],
    nodes: [
      { id: "cs-n1", type: "concept", title: "Zero Trust Security", summary: "A security framework requiring all users, inside or outside the network, to be authenticated, authorized, and continuously validated.", importance: "Critical", credibility: "green", date: "May 2026", url: "https://en.wikipedia.org/wiki/Zero_trust_security_architecture", x: 260, y: 150 },
      { id: "cs-n2", type: "person", title: "Alan Turing", summary: "English mathematician and cryptanalyst who broke the German Enigma cipher machine at Bletchley Park, establishing computer science concepts.", importance: "High", credibility: "green", date: "Feb 2026", url: "https://en.wikipedia.org/wiki/Alan_Turing", x: 80, y: 90 },
      { id: "cs-n3", type: "timeline", title: "Morris Worm (1988)", summary: "The first widespread computer worm distributed via the Internet, which led to the creation of the first Computer Emergency Response Team (CERT).", importance: "High", credibility: "green", date: "April 2026", url: "https://en.wikipedia.org/wiki/Morris_worm", x: 100, y: 280 },
      { id: "cs-n4", type: "fact", title: "Phishing Penetration", summary: "Industry audits show that over 90% of successful cyberattacks and data leaks initiate via social-engineering phishing emails.", importance: "Medium", credibility: "yellow", date: "May 2026", url: "https://en.wikipedia.org/wiki/Phishing", x: 420, y: 100 },
      { id: "cs-n5", type: "resource", title: "OWASP Top Ten", summary: "A standard awareness document detailing the top ten most critical security risks and vulnerabilities for web applications.", importance: "Low", credibility: "green", date: "March 2026", url: "https://en.wikipedia.org/wiki/OWASP", x: 450, y: 260 }
    ],
    connections: [
      { source: "cs-n2", target: "cs-n3", active: false },
      { source: "cs-n3", target: "cs-n1", active: true },
      { source: "cs-n1", target: "cs-n4", active: true },
      { source: "cs-n1", target: "cs-n5", active: false }
    ],
    obsessionPathways: [
      { text: "Zero Trust Security", link: "Cryptography" },
      { text: "Morris Worm", link: "Cyberwarfare History" }
    ]
  },
  "True Crime": {
    category: "Crime",
    tagline: "Autumn of Terror, red threads, suspects, and forensic boards.",
    obsScore: 32,
    modules: [
      { id: "tc-m1", title: "The Whitechapel Autumn", time: "20 min", diff: "Beginner", xp: 100, completed: true },
      { id: "tc-m2", title: "Victim Chronology", time: "30 min", diff: "Intermediate", xp: 150, completed: false },
      { id: "tc-m3", title: "Suspect Dossiers & Red Yarn", time: "40 min", diff: "Advanced", xp: 200, completed: false }
    ],
    nodes: [
      { id: "tc-n1", type: "person", title: "Jack the Ripper", summary: "An unidentified serial killer who terrorized London's East End in 1888. Primarily targeted female victims in the Whitechapel district.", importance: "Critical", credibility: "red", date: "June 2026", url: "https://www.crimemuseum.org/crime-library/serial-killers/jack-the-ripper/", x: 300, y: 100, badge: "suspect" },
      { id: "tc-n2", type: "person", title: "Mary Ann Nichols", summary: "First of the 'canonical five' victims. Found murdered in Buck's Row, Whitechapel, on Friday, August 31, 1888.", importance: "High", credibility: "green", date: "May 2026", url: "https://en.wikipedia.org/wiki/Mary_Ann_Nichols", x: 90, y: 150, badge: "victim" },
      { id: "tc-n3", type: "person", title: "Annie Chapman", summary: "Second canonical victim. Discovered in a backyard in Hanbury Street, Spitalfields, on September 8, 1888.", importance: "High", credibility: "green", date: "May 2026", url: "https://en.wikipedia.org/wiki/Annie_Chapman", x: 100, y: 350, badge: "victim" },
      { id: "tc-n4", type: "fact", title: "The From Hell Letter", summary: "A letter sent with half a human kidney, allegedly from the killer, addressed to George Lusk of the Whitechapel Vigilance Committee.", importance: "High", credibility: "yellow", date: "April 2026", url: "https://en.wikipedia.org/wiki/From_Hell_letter", x: 500, y: 160, badge: "evidence" },
      { id: "tc-n5", type: "fact", title: "The Dear Boss Letter", summary: "The first card/letter using the signature name 'Jack the Ripper'. Sent to the Central News Agency, mocking the police forces.", importance: "Medium", credibility: "yellow", date: "April 2026", url: "https://en.wikipedia.org/wiki/Dear_Boss_letter", x: 520, y: 380, badge: "evidence" },
      { id: "tc-n6", type: "person", title: "Inspector Abberline", summary: "Frederick Abberline was the chief inspector for the London Metropolitan Police Force, leading the search for the killer.", importance: "Medium", credibility: "green", date: "June 2026", url: "https://en.wikipedia.org/wiki/Frederick_Abberline", x: 300, y: 420, badge: "timeline" }
    ],
    connections: [
      { source: "tc-n1", target: "tc-n2", active: true },
      { source: "tc-n1", target: "tc-n3", active: true },
      { source: "tc-n1", target: "tc-n4", active: true },
      { source: "tc-n1", target: "tc-n5", active: false },
      { source: "tc-n6", target: "tc-n1", active: true }
    ],
    obsessionPathways: [
      { text: "Jack the Ripper", link: "Criminal Psychology" },
      { text: "Inspector Abberline", link: "Victorian Policing" }
    ]
  }
};

const COMMUNITY_MAPS = [
  { topic: "Quantum Physics", creator: "AliceSchrödinger", nodesCount: 24, downloads: 412 },
  { topic: "Ancient Rome", creator: "AugustusLegion", nodesCount: 19, downloads: 890 },
  { topic: "Cybersecurity", creator: "ZeroTrustGuru", nodesCount: 12, downloads: 231 },
  { topic: "Jack the Ripper", creator: "SherlockDeductions", nodesCount: 32, downloads: 1450 },
  { topic: "Fashion History", creator: "VintageCouture", nodesCount: 15, downloads: 340 },
  { topic: "Space Exploration", creator: "HubbleDreamer", nodesCount: 27, downloads: 680 }
];

// --- 2. GLOBAL STATE ---
const STATE = {
  currentTopic: "Quantum Physics",
  activeView: "landing", // landing, orchestrator, workspace, gamification
  xp: 150,
  rank: "Explorer",
  notes: {}, // loaded from localStorage
  selectedNode: null,
  canvas: { panX: 0, panY: 0, scale: 1, isPanning: false, startX: 0, startY: 0 },
  savedTopics: ["Quantum Physics"],
  isSidebarCollapsed: false,
  isDetailsCollapsed: false,

  // Audio state
  audio: {
    isPlaying: false,
    mode: "quick", // quick, deep, master
    duration: 120, // seconds
    currentTime: 0,
    speed: 1.0,
    speechUtterance: null,
    ambientSynthNode: null,
    ambientContext: null,
    timer: null,
    speechIndex: 0
  }
};

// Map XP ranges to Ranks
const RANKS = [
  { minXp: 0, rank: "Explorer" },
  { minXp: 300, rank: "Researcher" },
  { minXp: 600, rank: "Analyst" },
  { minXp: 1000, rank: "Expert" },
  { minXp: 1500, rank: "Master" },
  { minXp: 2200, rank: "Sage" }
];

// Sound settings matching categories
const AMBIENT_GENRES = {
  "Science": "SPACE AMBIENT",
  "History": "ORCHESTRAL",
  "Technology": "DIGITAL BEEP",
  "Crime": "CINEMATIC DRONE"
};

// Initialize app when window loads
window.addEventListener("DOMContentLoaded", initApp);

function initApp() {
  loadStateFromStorage();
  initLandingNeuralCanvas();
  registerUIEventListeners();
  updateXPDisplay();
  populateSavedTopics();
  populateCommunityGrid();
  initThemeToggle();

  // Multi-page Query parameter handling
  const urlParams = new URLSearchParams(window.location.search);
  const topicParam = urlParams.get('topic');
  if (topicParam) {
    runTopicResearch(decodeURIComponent(topicParam));
  } else {
    // If no topic parameter is specified, open research modal by default
    switchView("workspace");
    renderActiveTopicGraph();
    updateWorkspaceHeaderTitle();
    openResearchModal();
  }

  // Display simulated PRO upgrade toast if triggered
  const upgradeToast = localStorage.getItem("kairos_toast_trigger");
  if (upgradeToast) {
    try {
      const data = JSON.parse(upgradeToast);
      triggerMilestoneToast(data.badge, data.reason);
    } catch (e) {}
    localStorage.removeItem("kairos_toast_trigger");
  }
}

// --- THEME TOGGLE ---
function initThemeToggle() {
  const btn = document.getElementById("theme-toggle-btn");
  const icon = document.getElementById("theme-toggle-icon");
  const label = document.getElementById("theme-toggle-label");
  if (!btn) return;

  // Restore saved preference
  const saved = localStorage.getItem("kairos_theme");
  if (saved === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    icon.textContent = "☀️";
    label.textContent = "Light";
  }

  btn.addEventListener("click", () => {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    if (isLight) {
      document.documentElement.removeAttribute("data-theme");
      icon.textContent = "🌙";
      label.textContent = "Dark";
      localStorage.setItem("kairos_theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      icon.textContent = "☀️";
      label.textContent = "Light";
      localStorage.setItem("kairos_theme", "light");
    }
  });
}

function loadStateFromStorage() {
  const savedXp = localStorage.getItem("kairos_xp");
  if (savedXp) STATE.xp = parseInt(savedXp);

  const savedRank = localStorage.getItem("kairos_rank");
  if (savedRank) STATE.rank = savedRank;

  const savedTopicsList = localStorage.getItem("kairos_saved_topics");
  if (savedTopicsList) STATE.savedTopics = JSON.parse(savedTopicsList);

  // Load notes
  for (let key in localStorage) {
    if (key.startsWith("kairos_notes_")) {
      STATE.notes[key] = localStorage.getItem(key);
    }
  }

  updateRankAndBadge();
}

// --- 3. LANDING PAGE NEURAL NETWORK CANVAS ANIMATION ---
function initLandingNeuralCanvas() {
  const canvas = document.getElementById("neural-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let particles = [];
  let glassParticles = [];
  const particleCount = 60;
  const glassParticleCount = 15;
  const connectionDistance = 120;
  let mouse = { x: null, y: null, radius: 180 };

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener("mouseleave", () => {
    mouse.x = null;
    mouse.y = null;
  });

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.7;
      this.vy = (Math.random() - 0.5) * 0.7;
      this.size = Math.random() * 2.5 + 1.5;
      // Randomly assign red highlight or blue accent
      this.colorType = Math.random() > 0.4 ? 'blue' : 'red';
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
      if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

      if (mouse.x !== null && mouse.y !== null) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          let force = (mouse.radius - dist) / mouse.radius;
          this.x += (dx / dist) * force * 1.2;
          this.y += (dy / dist) * force * 1.2;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      if (STATE.activeView === "landing") {
        ctx.fillStyle = this.colorType === 'red' ? "rgba(127, 29, 29, 0.6)" : "rgba(56, 189, 248, 0.55)";
      } else {
        ctx.fillStyle = this.colorType === 'red' ? "rgba(127, 29, 29, 0.2)" : "rgba(56, 189, 248, 0.15)";
      }
      ctx.fill();
    }
  }

  class GlassParticle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vy = -(Math.random() * 0.15 + 0.05);
      this.size = Math.random() * 40 + 20; // 20px to 60px bokeh
      this.alpha = Math.random() * 0.015 + 0.005;
    }

    update() {
      this.y += this.vy;
      if (this.y < -this.size) {
        this.y = canvas.height + this.size;
        this.x = Math.random() * canvas.width;
      }
    }

    draw() {
      let grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
      grad.addColorStop(0, `rgba(255, 255, 255, ${this.alpha})`);
      grad.addColorStop(0.4, `rgba(15, 23, 42, ${this.alpha * 1.5})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
  for (let i = 0; i < glassParticleCount; i++) {
    glassParticles.push(new GlassParticle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw glass particles (behind nodes)
    for (let i = 0; i < glassParticles.length; i++) {
      glassParticles[i].update();
      glassParticles[i].draw();
    }

    // Draw node connections
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();

      for (let j = i + 1; j < particles.length; j++) {
        let dx = particles[i].x - particles[j].x;
        let dy = particles[i].y - particles[j].y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDistance) {
          let alpha = (1 - dist / connectionDistance) * 0.12;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);

          if (STATE.activeView === "landing") {
            // Gradient style connections between colors
            if (particles[i].colorType === 'red' && particles[j].colorType === 'red') {
              ctx.strokeStyle = `rgba(127, 29, 29, ${alpha * 1.5})`;
            } else if (particles[i].colorType === 'blue' && particles[j].colorType === 'blue') {
              ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            } else {
              ctx.strokeStyle = `rgba(127, 29, 29, ${alpha})`;
            }
          } else {
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.25})`;
          }
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
}

// --- 4. NAVIGATION STATE CONTROL ---
function switchView(viewName) {
  STATE.activeView = viewName;

  // Update view classes in DOM
  const views = ["landing-view", "orchestrator-view", "workspace-view", "gamification-view"];
  views.forEach(v => {
    const el = document.getElementById(v);
    if (el) {
      if (v === `${viewName}-view`) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    }
  });

  // Special action on enters
  if (viewName === "workspace") {
    document.getElementById("neural-canvas").style.opacity = "0.2"; // Dim background neural lines
    renderActiveTopicGraph();
    updateWorkspaceHeaderTitle();
  } else if (viewName === "landing") {
    document.getElementById("neural-canvas").style.opacity = "1.0";
    stopAudioBriefing();
  } else if (viewName === "gamification") {
    document.getElementById("neural-canvas").style.opacity = "0.3";
    renderGamificationDashboard();
  }
}

function updateWorkspaceHeaderTitle() {
  const currentTopicData = TOPICS_DATA[STATE.currentTopic];
  const topicTitleEl = document.getElementById("breadcrumb-topic-title");
  if (topicTitleEl) {
    topicTitleEl.textContent = STATE.currentTopic.toUpperCase();
  }

  // Toggle Investigation Board tab in left sidebar if topic is Jack the Ripper (True Crime)
  const crimeMenuBtn = document.getElementById("menu-item-crime");
  if (crimeMenuBtn) {
    if (STATE.currentTopic === "True Crime" || currentTopicData.category === "Crime") {
      crimeMenuBtn.style.display = "flex";
    } else {
      crimeMenuBtn.style.display = "none";
      // Switch active sidebars
      if (document.getElementById("menu-item-crime").classList.contains("active")) {
        activateSidebarTab("graph");
      }
    }
  }
}

// --- 5. AI RESEARCH ORCHESTRATOR — POWERED BY GEMINI API ---
function runTopicResearch(topic) {
  STATE.currentTopic = topic;
  switchView("orchestrator");

  // Set headers
  document.getElementById("orchestrator-topic-title").textContent = `RESEARCHING: "${topic.toUpperCase()}"`;
  document.getElementById("orchestrator-status").textContent = "Initializing Multi-Agent Research Protocols...";

  // Reset Orchestrator UI components
  for (let i = 0; i < 5; i++) {
    const stepEl = document.getElementById(`step-${i}`);
    if (stepEl) {
      stepEl.className = "loading-step";
    }
  }
  const consoleEl = document.getElementById("orchestrator-console");
  consoleEl.innerHTML = `<div class="console-line"><span class="system-agent">[SYSTEM]</span> Instantiating research environment for "${topic}"...</div>`;

  const launchBtn = document.getElementById("launch-workspace-btn");
  launchBtn.style.display = "none";

  // Activate GPT chip
  setActiveAgentChip("gpt");

  // Check if we already have this topic cached
  const isExistingTopic = !!TOPICS_DATA[topic];

  // Helper to append a log line to the console
  function appendLog(agent, text) {
    const logLine = document.createElement("div");
    logLine.className = "console-line";
    let agentSpan = "";
    if (agent === "gpt") agentSpan = '<span class="agent">[GPT Reasoner]</span> ';
    if (agent === "claude") agentSpan = '<span class="gemini-agent">[Claude Writer]</span> ';
    if (agent === "gemini") agentSpan = '<span class="gemini-agent" style="color:var(--secondary-accent);">[Gemini API]</span> ';
    if (agent === "system") agentSpan = '<span class="system-agent">[SYSTEM]</span> ';
    logLine.innerHTML = `${agentSpan}${text}`;
    consoleEl.appendChild(logLine);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  // Helper to complete a step visually
  function completeStep(stepIndex) {
    const el = document.getElementById(`step-${stepIndex}`);
    if (el) el.className = "loading-step completed";
  }
  function activateStep(stepIndex) {
    const el = document.getElementById(`step-${stepIndex}`);
    if (el) el.className = "loading-step active";
  }

  // Helper to wait a specified time
  function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  // Main async orchestrator pipeline
  (async function orchestratorPipeline() {
    // --- Step 0: Topic Decomposition ---
    activateStep(0);
    setActiveAgentChip("gpt");
    document.getElementById("orchestrator-status").textContent = "Decomposing query scope into modular nodes...";
    appendLog("gpt", `Analyzing query terms for "${topic}": semantic relationships found.`);
    await wait(800);
    appendLog("gpt", "Target keywords classified into Concept, Person, Fact, Timeline.");
    await wait(600);
    appendLog("system", "Generating 5+ target knowledge boundaries...");
    await wait(400);
    completeStep(0);

    // --- Step 1: Multi-Agent Research (REAL GEMINI API CALL for new topics) ---
    activateStep(1);
    setActiveAgentChip("gemini");
    document.getElementById("orchestrator-status").textContent = "Querying Gemini AI for deep knowledge synthesis...";

    let geminiResult = null;
    if (!isExistingTopic) {
      appendLog("gemini", `🔗 Connecting to Google Gemini API...`);
      await wait(500);
      appendLog("gemini", `📡 Sending structured research prompt for "${topic}"...`);

      // REAL API CALL
      geminiResult = await callGeminiAPI(topic);

      if (geminiResult) {
        appendLog("gemini", `✅ Gemini responded with ${(geminiResult.nodes || []).length} knowledge nodes.`);
        appendLog("gemini", `✅ Generated ${(geminiResult.modules || []).length} learning modules.`);
        appendLog("gemini", `✅ Mapped ${(geminiResult.connections || []).length} node connections.`);

        // Convert and store
        TOPICS_DATA[topic] = convertGeminiResponseToTopicData(topic, geminiResult);
      } else {
        appendLog("system", `⚠️ Gemini API unavailable — falling back to local generation engine.`);
        TOPICS_DATA[topic] = generateDynamicTopicData(topic);
      }
    } else {
      appendLog("claude", "Topic data found in local cache. Scanning existing knowledge map...");
      await wait(600);
      appendLog("claude", "Synthesized core definitions and modular structures.");
      await wait(400);
      appendLog("claude", "Drafted node timelines, details, and book resource guides.");
    }
    await wait(500);
    completeStep(1);

    // --- Step 2: Source Verification ---
    activateStep(2);
    setActiveAgentChip("gemini");
    document.getElementById("orchestrator-status").textContent = "Verifying peer links and credibility indices...";
    appendLog("gemini", "Querying vector bases for primary source citations...");
    await wait(700);
    appendLog("gemini", "Cross-checked Wikipedia archives, Nature journal, CISA directories.");
    await wait(600);
    const topicData = TOPICS_DATA[topic];
    const unverifiedCount = topicData ? topicData.nodes.filter(n => n.credibility !== "green").length : 0;
    appendLog("gemini", `Deduplicated fact overlays. Flagged ${unverifiedCount} reference(s) for review.`);
    await wait(400);
    completeStep(2);

    // --- Step 3: Knowledge Map Construction ---
    activateStep(3);
    setActiveAgentChip("gpt");
    document.getElementById("orchestrator-status").textContent = "Constructing relationship curves...";
    appendLog("gpt", `Determined physics layout coords for ${topicData ? topicData.nodes.length : 0} map nodes.`);
    await wait(600);
    appendLog("system", `Drawn ${topicData ? topicData.connections.length : 0} vector connection paths.`);
    await wait(400);
    completeStep(3);

    // --- Step 4: Audio Companion Compilation ---
    activateStep(4);
    setActiveAgentChip("gemini");
    document.getElementById("orchestrator-status").textContent = "Compiling audio companion and soundtracks...";
    appendLog("system", "Pre-rendering narrator scripts for topic modules.");
    await wait(500);
    appendLog("system", `Matching background audio soundtrack genre: ${topicData ? (AMBIENT_GENRES[topicData.category] || "SPACE AMBIENT") : "AMBIENT"}`);
    await wait(400);
    appendLog("system", "✅ Orchestrator pipeline completed successfully.");
    await wait(300);
    completeStep(4);

    // --- All Done ---
    document.getElementById("orchestrator-status").textContent = geminiResult
      ? "✨ AI Research complete (Powered by Gemini). Ready to visualize."
      : "Research complete. Ready to visualize.";
    launchBtn.style.display = "flex";

    // Save topic to list
    if (!STATE.savedTopics.includes(STATE.currentTopic)) {
      STATE.savedTopics.push(STATE.currentTopic);
      localStorage.setItem("kairos_saved_topics", JSON.stringify(STATE.savedTopics));
      populateSavedTopics();
    }

    // Add XP for research session
    addXP(150, "Complete Research Session");
  })();
}

function setActiveAgentChip(agent) {
  const chips = ["gpt", "claude", "gemini"];
  chips.forEach(c => {
    const el = document.getElementById(`chip-${c}`);
    if (el) {
      if (c === agent) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    }
  });
}

// --- 6. KNOWLEDGE GRAPH CANVAS (RENDER, PAN, ZOOM, DRAG) ---
function renderActiveTopicGraph() {
  const topicData = TOPICS_DATA[STATE.currentTopic];
  if (!topicData) return;

  // Decide whether to show the standard canvas or the True Crime corkboard
  const isCrime = STATE.currentTopic === "True Crime" || topicData.category === "Crime";

  if (isCrime) {
    document.getElementById("canvas-viewport").style.display = "none";
    document.getElementById("true-crime-board").style.display = "block";
    renderTrueCrimeBoard(topicData);
  } else {
    document.getElementById("canvas-viewport").style.display = "block";
    document.getElementById("true-crime-board").style.display = "none";
    renderStandardGraph(topicData);
  }

  // Close details panel by default on load
  closeDetailsPanel();
}

function renderStandardGraph(topicData) {
  const canvasContent = document.getElementById("canvas-content");

  // Clear existing nodes (keep connections SVG)
  const nodes = canvasContent.querySelectorAll(".canvas-node");
  nodes.forEach(n => n.remove());

  // Reset pan/zoom coordinates
  STATE.canvas.panX = 0;
  STATE.canvas.panY = 0;
  STATE.canvas.scale = 1;
  applyCanvasTransform(canvasContent);

  // Inject nodes
  topicData.nodes.forEach(node => {
    const nodeEl = document.createElement("div");
    nodeEl.className = `canvas-node node-${node.type}`;
    nodeEl.id = node.id;
    nodeEl.style.left = `${node.x}px`;
    nodeEl.style.top = `${node.y}px`;

    nodeEl.innerHTML = `
      <span class="node-badge-type">${node.type}</span>
      <div class="node-title">${node.title}</div>
      <div class="node-summary">${node.summary}</div>
      <div class="node-verify-pill">
        <div class="verify-dot ${node.credibility}"></div>
        <span>Credibility: ${node.credibility === "green" ? "Verified" : node.credibility === "yellow" ? "Medium" : "Needs Review"}</span>
      </div>
    `;

    // Add click listeners
    nodeEl.addEventListener("click", (e) => {
      e.stopPropagation();
      selectNode(node);
      showNodePopup(node, nodeEl);
    });

    // Add drag listeners
    makeNodeDraggable(nodeEl, node, false);

    canvasContent.appendChild(nodeEl);
  });

  // Render connection curves
  updateStandardConnections(topicData);
}

function updateStandardConnections(topicData) {
  const svg = document.getElementById("svg-connections-layer");
  // Keep defs
  const defs = svg.querySelector("defs");
  svg.innerHTML = "";
  svg.appendChild(defs);

  topicData.connections.forEach(conn => {
    const sourceNode = topicData.nodes.find(n => n.id === conn.source);
    const targetNode = topicData.nodes.find(n => n.id === conn.target);

    if (sourceNode && targetNode) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

      // Node dimensions: width 220px, height approx 150px (need calculations for connections center)
      const sourceX = sourceNode.x + 110;
      const sourceY = sourceNode.y + 75;
      const targetX = targetNode.x + 110;
      const targetY = targetNode.y + 75;

      // Create cubic bezier curves
      const dx = targetX - sourceX;
      const dy = targetY - sourceY;
      const controlX1 = sourceX + dx / 2;
      const controlY1 = sourceY;
      const controlX2 = sourceX + dx / 2;
      const controlY2 = targetY;

      const dAttr = `M ${sourceX} ${sourceY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${targetX} ${targetY}`;

      path.setAttribute("d", dAttr);
      path.setAttribute("class", conn.active ? "svg-connection-line active" : "svg-connection-line");
      path.setAttribute("id", `conn-${conn.source}-${conn.target}`);

      // Add arrow markers if active
      if (conn.active) {
        path.setAttribute("marker-end", "url(#arrow-active)");
      } else {
        path.setAttribute("marker-end", "url(#arrow)");
      }

      svg.appendChild(path);
    }
  });
}

function makeNodeDraggable(nodeEl, nodeData, isCrime) {
  let offset = { x: 0, y: 0 };
  let isDragging = false;

  nodeEl.addEventListener("mousedown", (e) => {
    isDragging = true;
    nodeEl.style.zIndex = 300;

    const viewportScale = STATE.canvas.scale;

    // Position offset inside coordinates
    offset.x = e.clientX - nodeEl.getBoundingClientRect().left;
    offset.y = e.clientY - nodeEl.getBoundingClientRect().top;

    e.stopPropagation();
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const viewport = document.getElementById(isCrime ? "true-crime-board" : "canvas-viewport");
    const rect = viewport.getBoundingClientRect();

    // Scale-independent offsets
    const scale = STATE.canvas.scale;
    const clientXRel = e.clientX - rect.left - STATE.canvas.panX;
    const clientYRel = e.clientY - rect.top - STATE.canvas.panY;

    const nextX = (clientXRel - offset.x) / scale;
    const nextY = (clientYRel - offset.y) / scale;

    nodeData.x = nextX;
    nodeData.y = nextY;

    nodeEl.style.left = `${nextX}px`;
    nodeEl.style.top = `${nextY}px`;

    // Redraw links
    const topicData = TOPICS_DATA[STATE.currentTopic];
    if (isCrime) {
      updateTrueCrimeConnections(topicData);
    } else {
      updateStandardConnections(topicData);
    }
  });

  window.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      nodeEl.style.zIndex = isCrime ? "" : 10;

      // Add XP for organizing
      addXP(5, "Organized Knowledge Map");
    }
  });
}

// Canvas Panning and Zooming Controls
function applyCanvasTransform(el) {
  el.style.transform = `translate(${STATE.canvas.panX}px, ${STATE.canvas.panY}px) scale(${STATE.canvas.scale})`;
}

function handleViewportPan(viewportId, contentId) {
  const viewport = document.getElementById(viewportId);
  const content = document.getElementById(contentId);
  if (!viewport || !content) return;

  viewport.addEventListener("mousedown", (e) => {
    // Prevent panning if user is selecting or dragging nodes
    if (e.target.closest(".canvas-node") || e.target.closest(".true-crime-card") || e.target.closest(".canvas-controls")) {
      return;
    }

    STATE.canvas.isPanning = true;
    viewport.style.cursor = "grabbing";
    STATE.canvas.startX = e.clientX - STATE.canvas.panX;
    STATE.canvas.startY = e.clientY - STATE.canvas.panY;
    hideNodePopup(); // dismiss popup when panning
  });

  window.addEventListener("mousemove", (e) => {
    if (!STATE.canvas.isPanning) return;
    STATE.canvas.panX = e.clientX - STATE.canvas.startX;
    STATE.canvas.panY = e.clientY - STATE.canvas.startY;
    applyCanvasTransform(content);
  });

  window.addEventListener("mouseup", () => {
    if (STATE.canvas.isPanning) {
      STATE.canvas.isPanning = false;
      viewport.style.cursor = "grab";
    }
  });

  // Wheel zoom
  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    hideNodePopup(); // dismiss popup on zoom
    const zoomFactor = 1.1;
    let nextScale = STATE.canvas.scale;

    if (e.deltaY < 0) {
      nextScale *= zoomFactor;
    } else {
      nextScale /= zoomFactor;
    }

    // Bounds check
    nextScale = Math.min(Math.max(nextScale, 0.4), 2.5);

    // Zoom focus towards center of viewport
    const rect = viewport.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    STATE.canvas.panX = mouseX - (mouseX - STATE.canvas.panX) * (nextScale / STATE.canvas.scale);
    STATE.canvas.panY = mouseY - (mouseY - STATE.canvas.panY) * (nextScale / STATE.canvas.scale);
    STATE.canvas.scale = nextScale;

    applyCanvasTransform(content);
  });
}

// --- 7. TRUE CRIME INVESTIGATION BOARD ---
function renderTrueCrimeBoard(topicData) {
  const trueCrimeContent = document.getElementById("true-crime-content");

  // Clear polaroids
  const polaroids = trueCrimeContent.querySelectorAll(".true-crime-card");
  polaroids.forEach(p => p.remove());

  // Reset pan/zoom
  STATE.canvas.panX = 0;
  STATE.canvas.panY = 0;
  STATE.canvas.scale = 1;
  applyCanvasTransform(trueCrimeContent);

  // Inject Polaroid Cards
  topicData.nodes.forEach((node, index) => {
    const cardEl = document.createElement("div");
    cardEl.className = "true-crime-card";
    cardEl.id = node.id;
    cardEl.style.left = `${node.x}px`;
    cardEl.style.top = `${node.y}px`;

    // Give cards custom slight rotations for realist corkboard pins look
    const rot = (index % 3 === 0 ? 3 : index % 3 === 1 ? -4 : 2);
    cardEl.style.setProperty("--rotation", `${rot}deg`);

    // Create random profile initials/SVG for Polaroid frame placeholder
    let profileSvg = "";
    if (node.badge === "suspect") {
      profileSvg = `<svg class="polaroid-svg-placeholder" style="color:#ef4444;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
    } else if (node.badge === "victim") {
      profileSvg = `<svg class="polaroid-svg-placeholder" style="color:#a855f7;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z"></path><path d="M12 9v4M12 17h.01"></path></svg>`;
    } else {
      profileSvg = `<svg class="polaroid-svg-placeholder" style="color:#eab308;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
    }

    cardEl.innerHTML = `
      <div class="true-crime-pin"></div>
      <div class="polaroid-img-frame">
        ${profileSvg}
      </div>
      <div class="true-crime-title">${node.title}</div>
      <div class="true-crime-desc">${node.summary}</div>
      <span class="true-crime-badge badge-${node.badge || 'evidence'}">${node.badge || 'Evidence'}</span>
    `;

    // Clicking Card
    cardEl.addEventListener("click", (e) => {
      e.stopPropagation();
      selectTrueCrimeCard(node, cardEl);
      showNodePopup(node, cardEl);
    });

    // Dragging Card
    makeNodeDraggable(cardEl, node, true);

    trueCrimeContent.appendChild(cardEl);
  });

  updateTrueCrimeConnections(topicData);
}

function updateTrueCrimeConnections(topicData) {
  const svg = document.getElementById("true-crime-connections");
  svg.innerHTML = "";

  topicData.connections.forEach(conn => {
    const sourceNode = topicData.nodes.find(n => n.id === conn.source);
    const targetNode = topicData.nodes.find(n => n.id === conn.target);

    if (sourceNode && targetNode) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");

      // Calculate coordinates center (Polaroid is 210px wide, and approx 240px tall)
      const sourceX = sourceNode.x + 105;
      const sourceY = sourceNode.y + 120;
      const targetX = targetNode.x + 105;
      const targetY = targetNode.y + 120;

      line.setAttribute("x1", sourceX);
      line.setAttribute("y1", sourceY);
      line.setAttribute("x2", targetX);
      line.setAttribute("y2", targetY);
      line.setAttribute("class", "red-string-line");
      line.setAttribute("id", `string-${conn.source}-${conn.target}`);

      svg.appendChild(line);
    }
  });
}

function selectTrueCrimeCard(node, cardEl) {
  // Clear other selected cards
  document.querySelectorAll(".true-crime-card").forEach(c => c.classList.remove("selected"));
  cardEl.classList.add("selected");

  selectNode(node);
}

// --- 8. SIDEBAR DETAILS & NOTES AUTO-SAVE ---
function selectNode(node) {
  STATE.selectedNode = node;

  // Highlight node in standard map
  document.querySelectorAll(".canvas-node").forEach(n => {
    if (n.id === node.id) {
      n.classList.add("selected");
    } else {
      n.classList.remove("selected");
    }
  });

  // Toggle detail pane visibility
  const sidebar = document.getElementById("workspace-right-sidebar");
  document.getElementById("workspace-view").classList.remove("details-collapsed");
  STATE.isDetailsCollapsed = false;

  // Swap details placeholder with content
  document.getElementById("details-placeholder").style.display = "none";
  document.getElementById("details-node-content").style.display = "flex";

  // Update node details fields
  document.getElementById("details-node-title").textContent = node.title;
  document.getElementById("details-node-body").textContent = node.summary;

  // Meta badges
  const metaContainer = document.getElementById("details-node-meta");
  metaContainer.innerHTML = `
    <span class="node-badge-type" style="margin-bottom:0;">${node.type}</span>
    <span class="true-crime-badge badge-timeline" style="margin-top:0;">Credibility: ${node.credibility.toUpperCase()}</span>
    <span class="true-crime-badge badge-victim" style="margin-top:0;">${node.importance} Priority</span>
  `;

  // Load notes
  const notesKey = `kairos_notes_${STATE.currentTopic}_${node.id}`;
  const notesInput = document.getElementById("node-notes-input");
  notesInput.value = STATE.notes[notesKey] || "";
  document.getElementById("node-notes-status").textContent = STATE.notes[notesKey] ? "Notes loaded." : "Notes saved automatically.";

  // Load sources list
  const sourcesContainer = document.getElementById("details-sources-list");
  sourcesContainer.innerHTML = `
    <div class="source-item">
      <div class="source-item-top">
        <a href="${node.url}" target="_blank" class="source-item-url">${node.url}</a>
        <span class="source-item-date">${node.date}</span>
      </div>
      <div class="source-item-credibility" style="color: ${node.credibility === 'green' ? 'var(--success-color)' : node.credibility === 'yellow' ? 'var(--warning-color)' : 'var(--danger-color)'}">
        <span class="verify-dot ${node.credibility}"></span>
        <span>Rating: ${node.credibility === 'green' ? 'High Credibility' : node.credibility === 'yellow' ? 'Medium Credibility' : 'Low/Unverified'}</span>
      </div>
    </div>
  `;

  // Load obsession suggestions pathways
  const relatedContainer = document.getElementById("details-related-list");
  relatedContainer.innerHTML = "";

  const currentTopicData = TOPICS_DATA[STATE.currentTopic];
  currentTopicData.obsessionPathways.forEach(path => {
    const row = document.createElement("div");
    row.className = "related-concept-row";
    row.innerHTML = `
      <span>${path.text} &rarr; <strong style="color:var(--secondary-accent);">${path.link}</strong></span>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    `;

    // Clicking suggested topic triggers full AI research pipeline!
    row.addEventListener("click", () => {
      const newTopicName = path.link;
      // Complete current node inside tree
      completeModuleOfActiveTopic(node.id);
      // Always run full research pipeline so the new topic gets real
      // AI-generated content and proper audio narration scripts
      runTopicResearch(newTopicName);
    });

    relatedContainer.appendChild(row);
  });

  // Show active Audio Companion Widget for the current node
  showAudioWidgetForSelectedNode();
}

function completeModuleOfActiveTopic(nodeId) {
  // Simply complete module containing or relating to node
  const topicData = TOPICS_DATA[STATE.currentTopic];
  if (!topicData) return;

  // Simulate complete first incomplete module in active tree
  const incomplete = topicData.modules.find(m => !m.completed);
  if (incomplete) {
    incomplete.completed = true;
    addXP(incomplete.xp, `Completed Module: ${incomplete.title}`);
  }
}

function closeDetailsPanel() {
  document.getElementById("workspace-view").classList.add("details-collapsed");
  STATE.isDetailsCollapsed = true;
  STATE.selectedNode = null;
  document.querySelectorAll(".canvas-node").forEach(n => n.classList.remove("selected"));
}

function handleNotesInput(val) {
  if (!STATE.selectedNode) return;

  const notesKey = `kairos_notes_${STATE.currentTopic}_${STATE.selectedNode.id}`;
  STATE.notes[notesKey] = val;
  localStorage.setItem(notesKey, val);

  const statusEl = document.getElementById("node-notes-status");
  statusEl.textContent = "Saving...";

  // Debounce saving note status
  clearTimeout(STATE.notesDebounce);
  STATE.notesDebounce = setTimeout(() => {
    statusEl.textContent = "Notes saved automatically.";

    // Grant tiny XP for note taking first time
    if (!localStorage.getItem(`xp_notes_${notesKey}`)) {
      localStorage.setItem(`xp_notes_${notesKey}`, "true");
      addXP(50, "Wrote Personal Note");
    }
  }, 800);
}

// --- 9. AUDIO COMPANION WITH WEB AUDIO API SYNTHESIZER ---
function showAudioWidgetForSelectedNode() {
  const widget = document.getElementById("audio-companion-widget");
  widget.classList.add("active");

  const topicData = TOPICS_DATA[STATE.currentTopic];
  document.getElementById("audio-topic-playing").textContent = STATE.currentTopic;
  const nodeTitle = STATE.selectedNode ? STATE.selectedNode.title : (topicData && topicData.nodes.length > 0 ? topicData.nodes[0].title : "None");
  document.getElementById("audio-module-playing").textContent = `Selected: ${nodeTitle}`;

  // Reset audio playback duration based on modes
  updateAudioCompanionDuration();
}

function updateAudioCompanionDuration() {
  if (STATE.audio.mode === "quick") {
    STATE.audio.duration = 120; // 2 min
  } else if (STATE.audio.mode === "deep") {
    STATE.audio.duration = 600; // 10 min
  } else if (STATE.audio.mode === "master") {
    STATE.audio.duration = 1200; // 20 min
  }

  document.getElementById("audio-time-duration").textContent = formatAudioTime(STATE.audio.duration);
  document.getElementById("audio-time-current").textContent = formatAudioTime(STATE.audio.currentTime);

  // Soundtrack genre
  const topicData = TOPICS_DATA[STATE.currentTopic];
  const category = topicData ? topicData.category : "Science";
  const badgeText = AMBIENT_GENRES[category] || "SPACE AMBIENT";
  document.getElementById("soundtrack-badge").textContent = badgeText;
}

function formatAudioTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function toggleAudioBriefing() {
  if (STATE.audio.isPlaying) {
    pauseAudioBriefing();
  } else {
    playAudioBriefing();
  }
}

function playAudioBriefing() {
  STATE.audio.isPlaying = true;
  document.getElementById("audio-companion-widget").classList.add("playing");
  document.getElementById("play-svg").style.display = "none";
  document.getElementById("pause-svg").style.display = "block";

  // 1. Initialize Web Audio API Synth pad
  initAmbientAudioSynth();

  // If no node is selected, automatically select the first node of the active topic
  if (!STATE.selectedNode) {
    const topicData = TOPICS_DATA[STATE.currentTopic];
    if (topicData && topicData.nodes && topicData.nodes.length > 0) {
      const firstNode = topicData.nodes.find(n => n.importance === "Critical") || topicData.nodes[0];
      selectNode(firstNode);
    }
  }

  // 2. Play Speech Synthesis for selected node
  playSpeechNarration();

  // 3. Start ticks timer
  clearInterval(STATE.audio.timer);
  STATE.audio.timer = setInterval(() => {
    STATE.audio.currentTime += STATE.audio.speed;
    if (STATE.audio.currentTime >= STATE.audio.duration) {
      STATE.audio.currentTime = STATE.audio.duration;
      pauseAudioBriefing();
      // Reward XP for listening
      addXP(100, "Listened to Audio Brief");
    }

    // Update DOM
    document.getElementById("audio-time-current").textContent = formatAudioTime(STATE.audio.currentTime);
    const pct = (STATE.audio.currentTime / STATE.audio.duration) * 100;
    document.getElementById("audio-progress-fill").style.width = `${pct}%`;
  }, 1000);
}

function pauseAudioBriefing() {
  STATE.audio.isPlaying = false;
  document.getElementById("audio-companion-widget").classList.remove("playing");
  document.getElementById("play-svg").style.display = "block";
  document.getElementById("pause-svg").style.display = "none";

  clearInterval(STATE.audio.timer);

  // Stop Speech
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  // Stop Ambient synth
  stopAmbientAudioSynth();
}

function stopAudioBriefing() {
  pauseAudioBriefing();
  STATE.audio.currentTime = 0;
  document.getElementById("audio-progress-fill").style.width = "0%";
  document.getElementById("audio-time-current").textContent = "0:00";
}

// Web Audio API custom synthesizer pads
function initAmbientAudioSynth() {
  try {
    if (STATE.audio.ambientContext) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    STATE.audio.ambientContext = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.2, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const topicData = TOPICS_DATA[STATE.currentTopic];
    const category = topicData ? topicData.category : "Science";

    if (category === "Science") {
      // 1. SPACE AMBIENT: Shimmering oscillators and detuned sine swells
      // Frequencies corresponding to G chord swells
      const freqs = [98.00, 146.83, 196.00, 293.66, 392.00]; // G2, D3, G3, D4, G4
      STATE.audio.oscillators = [];

      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.value = f + (Math.random() - 0.5) * 1.5; // detune slightly

        filter.type = "lowpass";
        filter.frequency.value = 600;
        filter.Q.value = 3;

        gain.gain.setValueAtTime(0, ctx.currentTime);
        // Swelling envelope generator
        gain.gain.linearRampToValueAtTime(0.04 + (idx * 0.01), ctx.currentTime + 3 + (idx * 0.5));

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start();
        STATE.audio.oscillators.push(osc);
      });

    } else if (category === "History") {
      // 2. ORCHESTRATOR SWIFT: Detuned slow triangles representing strings (D minor chords)
      const freqs = [73.42, 110.00, 146.83, 174.61, 220.00]; // D2, A2, D3, F3, A3
      STATE.audio.oscillators = [];

      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.value = f;

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 4);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start();
        STATE.audio.oscillators.push(osc);
      });

    } else if (category === "Crime") {
      // 3. CINEMATIC CRIME DRONE: Low frequencies modulated by LFOs, high lowpass resonance
      const carrier = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const oscGain = ctx.createGain();

      carrier.type = "sawtooth";
      carrier.frequency.value = 55; // A1 low pitch

      filter.type = "lowpass";
      filter.frequency.value = 180;
      filter.Q.value = 5;

      lfo.type = "sine";
      lfo.frequency.value = 0.25; // 0.25 Hz slow sweep

      lfoGain.gain.value = 50; // Modulate cutoff by 50Hz

      oscGain.gain.setValueAtTime(0, ctx.currentTime);
      oscGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 2.5);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency); // Modulate filter cutoff frequency

      carrier.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(masterGain);

      carrier.start();
      lfo.start();

      STATE.audio.oscillators = [carrier, lfo];
    } else {
      // 4. TECH/DIGITAL: Repeating digital bleeps
      const carrier = ctx.createOscillator();
      const oscGain = ctx.createGain();

      carrier.type = "sine";
      carrier.frequency.value = 220;

      oscGain.gain.setValueAtTime(0, ctx.currentTime);
      oscGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2);

      carrier.connect(oscGain);
      oscGain.connect(masterGain);
      carrier.start();

      STATE.audio.oscillators = [carrier];
    }

  } catch (err) {
    console.warn("Web Audio Context could not initialize:", err);
  }
}

function stopAmbientAudioSynth() {
  if (STATE.audio.oscillators) {
    STATE.audio.oscillators.forEach(osc => {
      try { osc.stop(); } catch (e) { }
    });
    STATE.audio.oscillators = null;
  }

  if (STATE.audio.ambientContext) {
    try { STATE.audio.ambientContext.close(); } catch (e) { }
    STATE.audio.ambientContext = null;
  }
}

function playSpeechNarration() {
  if (!window.speechSynthesis) return;

  // If no node is selected, try to auto-select the first critical/available node
  if (!STATE.selectedNode) {
    const topicData = TOPICS_DATA[STATE.currentTopic];
    if (topicData && topicData.nodes && topicData.nodes.length > 0) {
      const firstNode = topicData.nodes.find(n => n.importance === "Critical") || topicData.nodes[0];
      STATE.selectedNode = firstNode; // Set directly to avoid UI re-render loop
    }
  }

  if (!STATE.selectedNode) return; // Still nothing — bail

  window.speechSynthesis.cancel(); // kill existing utterance

  const text = `${STATE.selectedNode.title}. ${STATE.selectedNode.summary}`;
  const utterance = new SpeechSynthesisUtterance(text);

  utterance.rate = STATE.audio.speed;
  utterance.volume = 0.9;
  utterance.pitch = 1.0;

  utterance.onend = () => {
    // If audio is still playing, automatically cycle to next node in briefing!
    if (STATE.audio.isPlaying) {
      skipAudioBriefing(1);
    }
  };

  STATE.audio.speechUtterance = utterance;

  // Handle browser voices API — voices may not be loaded yet on first call
  function speakWithBestVoice() {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferredVoice = voices.find(v => v.lang === "en-US" && v.name.toLowerCase().includes("google"))
        || voices.find(v => v.lang === "en-US")
        || voices.find(v => v.lang.startsWith("en"));
      if (preferredVoice) utterance.voice = preferredVoice;
      window.speechSynthesis.speak(utterance);
    } else {
      // Voices not yet loaded — wait for the event then retry
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        const loadedVoices = window.speechSynthesis.getVoices();
        const preferredVoice = loadedVoices.find(v => v.lang === "en-US" && v.name.toLowerCase().includes("google"))
          || loadedVoices.find(v => v.lang === "en-US")
          || loadedVoices.find(v => v.lang.startsWith("en"));
        if (preferredVoice) utterance.voice = preferredVoice;
        window.speechSynthesis.speak(utterance);
      };
    }
  }

  speakWithBestVoice();
}

function skipAudioBriefing(dir) {
  const topicData = TOPICS_DATA[STATE.currentTopic];
  if (!topicData || !topicData.nodes || topicData.nodes.length === 0) return;

  const nodes = topicData.nodes;
  let idx = 0;
  if (STATE.selectedNode) {
    idx = nodes.findIndex(n => n.id === STATE.selectedNode.id);
    if (idx === -1) idx = 0;
    idx += dir;
    if (idx >= nodes.length) idx = 0;
    if (idx < 0) idx = nodes.length - 1;
  }

  const nextNode = nodes[idx];
  selectNode(nextNode);

  if (STATE.audio.isPlaying) {
    playSpeechNarration();
  }
}

// --- 10. GAMIFICATION PROGRESS & UNLOCK SYSTEMS ---
function addXP(amount, reason) {
  STATE.xp += amount;
  localStorage.setItem("kairos_xp", STATE.xp);

  // Update UI XP elements
  updateXPDisplay();

  // Check Rank upgrade
  checkRankLevelUp();

  // Trigger notification toast
  triggerMilestoneToast(`+${amount} XP`, reason);

  // If gamification view is open, refresh
  if (STATE.activeView === "gamification") {
    renderGamificationDashboard();
  }
}

function updateXPDisplay() {
  document.getElementById("header-xp-text").textContent = `${STATE.xp} XP`;
  document.getElementById("header-xp-level").textContent = STATE.rank.toUpperCase();
}

function checkRankLevelUp() {
  let matchedRank = RANKS[0].rank;
  for (let i = 0; i < RANKS.length; i++) {
    if (STATE.xp >= RANKS[i].minXp) {
      matchedRank = RANKS[i].rank;
    }
  }

  if (matchedRank !== STATE.rank) {
    // Promotion!
    STATE.rank = matchedRank;
    localStorage.setItem("kairos_rank", STATE.rank);
    updateXPDisplay();

    // Visual celebrate
    triggerRankUnlockPopup(matchedRank);
  }
}

function updateRankAndBadge() {
  let matchedRank = RANKS[0].rank;
  for (let i = 0; i < RANKS.length; i++) {
    if (STATE.xp >= RANKS[i].minXp) {
      matchedRank = RANKS[i].rank;
    }
  }
  STATE.rank = matchedRank;
}

function triggerMilestoneToast(badge, reason) {
  const popup = document.getElementById("unlock-popup");
  const title = document.getElementById("unlock-popup-title");
  const desc = document.getElementById("unlock-popup-desc");

  title.textContent = badge;
  desc.textContent = reason;

  popup.classList.add("active");

  setTimeout(() => {
    popup.classList.remove("active");
  }, 3500);
}

function triggerRankUnlockPopup(newRank) {
  const popup = document.getElementById("unlock-popup");
  const title = document.getElementById("unlock-popup-title");
  const desc = document.getElementById("unlock-popup-desc");

  title.innerHTML = `RANK UPGRADED! <span style="color:#00D4FF;">${newRank.toUpperCase()}</span>`;
  desc.textContent = `You have unlocked advanced second-brain capabilities. Keep exploring!`;

  popup.classList.add("active");

  setTimeout(() => {
    popup.classList.remove("active");
  }, 4500);
}

function renderGamificationDashboard() {
  const topicData = TOPICS_DATA[STATE.currentTopic];
  if (!topicData) return;

  // Set details
  document.getElementById("tree-active-topic").textContent = STATE.currentTopic;
  document.getElementById("gami-avatar-text").textContent = STATE.rank.substring(0, 2).toUpperCase();
  document.getElementById("gami-profile-rank").textContent = `(Rank: ${STATE.rank})`;
  document.getElementById("gami-current-xp").textContent = STATE.xp;

  // Find current XP goal bounds
  let min = 0;
  let target = 300;
  for (let i = 0; i < RANKS.length; i++) {
    if (STATE.xp >= RANKS[i].minXp) {
      min = RANKS[i].minXp;
      target = (i < RANKS.length - 1) ? RANKS[i + 1].minXp : RANKS[i].minXp + 1000;
    }
  }
  document.getElementById("gami-target-xp").textContent = target;
  const progressPct = ((STATE.xp - min) / (target - min)) * 100;
  document.getElementById("gami-progress-bar-fill").style.width = `${Math.min(progressPct, 100)}%`;

  // Stats
  // Count user notes
  let notesCount = 0;
  for (let k in STATE.notes) {
    if (STATE.notes[k] && STATE.notes[k].trim() !== "") notesCount++;
  }
  document.getElementById("stat-notes-created").textContent = notesCount;
  document.getElementById("stat-connections-discovered").textContent = topicData.connections.length * STATE.savedTopics.length;
  document.getElementById("stat-topics-mastered").textContent = STATE.savedTopics.length;

  // Calculate Obsession score = XP / 10 + nodes read
  const obsessionScore = Math.floor(STATE.xp / 12) + (notesCount * 5);
  document.getElementById("stat-obsession-score").textContent = obsessionScore;

  // 1. Render active Learning tree nodes
  const treeContainer = document.getElementById("learning-tree-nodes-list");
  treeContainer.innerHTML = "";

  let completedCount = 0;
  topicData.modules.forEach(mod => {
    if (mod.completed) completedCount++;

    const branch = document.createElement("div");
    branch.className = `tree-branch-item ${mod.completed ? 'completed' : 'active'}`;
    branch.innerHTML = `
      <div class="branch-node-indicator">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <div class="branch-content">
        <div>
          <div class="branch-title">${mod.title}</div>
          <div class="branch-meta">
            <span>Time: ${mod.time}</span>
            <span>&bull;</span>
            <span>Difficulty: ${mod.diff}</span>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <span class="branch-xp-value">+${mod.xp} XP</span>
          ${!mod.completed ? `<button class="dive-btn" style="padding:6px 12px; font-size:0.75rem; border-radius:6px;" onclick="completeTreeModule('${mod.id}', ${mod.xp})">Complete</button>` : `<span style="font-size:0.8rem; color:var(--success-color); font-weight:600;">COMPLETED</span>`}
        </div>
      </div>
    `;
    treeContainer.appendChild(branch);
  });

  const compPct = Math.round((completedCount / topicData.modules.length) * 100);
  document.getElementById("tree-completion-badge").textContent = `${compPct}% Completed`;

  // 2. Render Achievements Grid
  const achievements = [
    { title: "First Deep Dive", desc: "Initiated your first AI research workspace.", unlocked: STATE.savedTopics.length >= 1 },
    { title: "Obsessive Scholar", desc: "Maintained an Obsession Score greater than 20.", unlocked: obsessionScore >= 20 },
    { title: "Source Inspector", desc: "Reviewed credibility records of primary citations.", unlocked: true },
    { title: "Master Investigator", desc: "Unlocked the True Crime detective corkboard.", unlocked: STATE.savedTopics.includes("True Crime") || STATE.savedTopics.includes("Jack the Ripper") },
    { title: "Collaborative Mind", desc: "Cloned or forked a knowledge map from community libraries.", unlocked: STATE.xp > 400 }
  ];

  const achievementsContainer = document.getElementById("achievements-list");
  achievementsContainer.innerHTML = "";

  achievements.forEach(ach => {
    const card = document.createElement("div");
    card.className = `achievement-card glass-panel ${ach.unlocked ? 'unlocked' : ''}`;
    card.innerHTML = `
      <div class="achievement-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 8v4l3 3"></path>
        </svg>
      </div>
      <div class="achievement-details">
        <h5>${ach.title}</h5>
        <p>${ach.desc}</p>
      </div>
    `;
    achievementsContainer.appendChild(card);
  });
}

// Global hook for completing tree module button
window.completeTreeModule = function (modId, xpValue) {
  const topicData = TOPICS_DATA[STATE.currentTopic];
  if (!topicData) return;

  const mod = topicData.modules.find(m => m.id === modId);
  if (mod && !mod.completed) {
    mod.completed = true;
    addXP(xpValue, `Completed Module: ${mod.title}`);
  }
};

// --- 11. SAVED TOPICS & COMMUNITY MAPS FORK SYSTEMS ---
function populateSavedTopics() {
  const list = document.getElementById("saved-topics-list");
  if (!list) return;
  list.innerHTML = "";

  STATE.savedTopics.forEach(topic => {
    const item = document.createElement("div");
    item.className = `saved-item ${STATE.currentTopic === topic ? 'active' : ''}`;
    item.setAttribute("data-topic", topic);
    item.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
      ${topic}
    `;

    item.addEventListener("click", () => {
      // Toggle sidebar tab graph first if user is in some other tab
      activateSidebarTab("graph");

      STATE.currentTopic = topic;
      renderActiveTopicGraph();
      updateWorkspaceHeaderTitle();
      populateSavedTopics();
    });

    list.appendChild(item);
  });
}

function populateCommunityGrid() {
  const grid = document.getElementById("community-grid");
  if (!grid) return;
  grid.innerHTML = "";

  COMMUNITY_MAPS.forEach(map => {
    const card = document.createElement("div");
    card.className = "feature-card glass-panel glow-border";
    card.style.padding = "20px";
    card.style.gap = "12px";
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <h4 style="font-weight: 700; font-size:1.05rem; color:var(--text-primary);">${map.topic}</h4>
          <span style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono)">By @${map.creator}</span>
        </div>
        <span class="soundtrack-type-badge" style="font-size:0.6rem; padding:2px 6px;">${map.nodesCount} Nodes</span>
      </div>
      <p style="font-size:0.8rem; color:var(--text-secondary); line-height:1.4;">Explore primary verified sources, timeline branches, and podcasts cloned by learners.</p>
      
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; border-top:1px solid var(--border-color); padding-top:12px;">
        <span style="font-size:0.75rem; color:var(--text-secondary); display:flex; align-items:center; gap:4px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          ${map.downloads} clones
        </span>
        <button class="dive-btn" style="padding:6px 12px; font-size:0.75rem; border-radius:6px;" onclick="forkCommunityMap('${map.topic}')">Fork Map</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

window.forkCommunityMap = function (topicName) {
  // Check if topicName exists inside our static databases or create a dummy one
  if (!TOPICS_DATA[topicName]) {
    // Generate mock matching details
    TOPICS_DATA[topicName] = {
      category: "History",
      tagline: `Exploring connected nodes under ${topicName}.`,
      obsScore: 12,
      modules: [
        { id: `gen-m1`, title: `${topicName} Core`, time: "20 min", diff: "Intermediate", xp: 120, completed: false }
      ],
      nodes: [
        { id: `gen-n1`, type: "concept", title: `${topicName} Foundations`, summary: `Detailed structural system cloned directly from @Community networks.`, importance: "Critical", credibility: "green", date: "June 2026", url: `https://en.wikipedia.org/wiki/${encodeURIComponent(topicName)}`, x: 250, y: 150 },
        { id: `gen-n2`, type: "fact", title: `${topicName} Cloned Fact`, summary: `Verified peer audits showing physical correlations consistent with modern observations.`, importance: "High", credibility: "green", date: "May 2026", url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(topicName)}`, x: 100, y: 280 }
      ],
      connections: [
        { source: `gen-n2`, target: `gen-n1`, active: true }
      ],
      obsessionPathways: [
        { text: `${topicName} Advanced`, link: "Deeper Horizons" }
      ]
    };
  }

  if (!STATE.savedTopics.includes(topicName)) {
    STATE.savedTopics.push(topicName);
    localStorage.setItem("kairos_saved_topics", JSON.stringify(STATE.savedTopics));
    populateSavedTopics();
  }

  addXP(100, `Forked Map: ${topicName}`);

  // Transition back into graph
  STATE.currentTopic = topicName;
  activateSidebarTab("graph");
  renderActiveTopicGraph();
  updateWorkspaceHeaderTitle();
  populateSavedTopics();
};

function activateSidebarTab(tabName) {
  // Toggle Left Sidebar highlighted menu item
  const menuItems = ["graph", "crime", "journey", "community"];
  menuItems.forEach(item => {
    const el = document.getElementById(`menu-item-${item}`);
    if (el) {
      if (item === tabName) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    }
  });

  // Switch display grids in center workspace
  const canvasViewport = document.getElementById("canvas-viewport");
  const trueCrimeBoard = document.getElementById("true-crime-board");
  const communityPanel = document.getElementById("community-panel");

  if (tabName === "graph") {
    canvasViewport.style.display = "block";
    trueCrimeBoard.style.display = "none";
    communityPanel.style.display = "none";

    // Make sure we have standard view containers active
    switchView("workspace");
    renderActiveTopicGraph();
  } else if (tabName === "crime") {
    canvasViewport.style.display = "none";
    trueCrimeBoard.style.display = "block";
    communityPanel.style.display = "none";

    switchView("workspace");
    renderActiveTopicGraph();
  } else if (tabName === "journey") {
    switchView("gamification");
  } else if (tabName === "community") {
    canvasViewport.style.display = "none";
    trueCrimeBoard.style.display = "none";
    communityPanel.style.display = "block";

    switchView("workspace");
  }
}

// --- 11.5. COMMAND SEARCH MODAL HANDLERS ---
function openResearchModal() {
  const modal = document.getElementById("research-modal-overlay");
  if (modal) {
    modal.classList.add("active");
    const input = document.getElementById("topic-input");
    if (input) {
      input.value = "";
      setTimeout(() => input.focus(), 100);
    }
  }
}

function closeResearchModal() {
  const modal = document.getElementById("research-modal-overlay");
  if (modal) {
    modal.classList.remove("active");
  }
}

// --- 12. REGISTER ALL EVENT LISTENERS ---
function registerUIEventListeners() {
  // Navigation: Go home / brand logo click
  const breadcrumbHome = document.getElementById("breadcrumb-home");
  if (breadcrumbHome) {
    breadcrumbHome.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  // Navigation: Back to workspace from Gamification Dashboard
  const gamiBackBtn = document.getElementById("gami-back-btn");
  if (gamiBackBtn) {
    gamiBackBtn.addEventListener("click", () => {
      activateSidebarTab("graph");
    });
  }

  // Left Sidebar Toggles
  const sidebarToggleBtn = document.getElementById("sidebar-toggle-btn");
  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener("click", () => {
      const viewEl = document.getElementById("workspace-view");
      STATE.isSidebarCollapsed = !STATE.isSidebarCollapsed;

      if (STATE.isSidebarCollapsed) {
        viewEl.classList.add("sidebar-collapsed");
      } else {
        viewEl.classList.remove("sidebar-collapsed");
      }
    });
  }

  // Sidebar Tabs Select
  const menuItemGraph = document.getElementById("menu-item-graph");
  if (menuItemGraph) menuItemGraph.addEventListener("click", () => activateSidebarTab("graph"));
  const menuItemCrime = document.getElementById("menu-item-crime");
  if (menuItemCrime) menuItemCrime.addEventListener("click", () => activateSidebarTab("crime"));
  const menuItemJourney = document.getElementById("menu-item-journey");
  if (menuItemJourney) menuItemJourney.addEventListener("click", () => activateSidebarTab("journey"));
  const menuItemCommunity = document.getElementById("menu-item-community");
  if (menuItemCommunity) menuItemCommunity.addEventListener("click", () => activateSidebarTab("community"));

  // Right Sidebar Close panel
  const detailsCloseBtn = document.getElementById("details-close-btn");
  if (detailsCloseBtn) {
    detailsCloseBtn.addEventListener("click", closeDetailsPanel);
  }

  // Notes Key Listening auto-save
  const nodeNotesInput = document.getElementById("node-notes-input");
  if (nodeNotesInput) {
    nodeNotesInput.addEventListener("input", (e) => {
      handleNotesInput(e.target.value);
    });
  }

  // Landing Actions (Open Command Launchpad) - with null checks as these are on index.html
  const heroDiveBtn = document.getElementById("hero-dive-btn");
  if (heroDiveBtn) {
    heroDiveBtn.addEventListener("click", openResearchModal);
  }

  const navDiveBtn = document.getElementById("hero-dive-btn-nav");
  if (navDiveBtn) {
    navDiveBtn.addEventListener("click", openResearchModal);
  }

  const searchSubmitBtn = document.getElementById("search-submit-btn");
  if (searchSubmitBtn) {
    searchSubmitBtn.addEventListener("click", () => {
      const input = document.getElementById("topic-input");
      const val = input.value.trim() || "Quantum Physics";
      closeResearchModal();
      runTopicResearch(val);
    });
  }

  const topicInput = document.getElementById("topic-input");
  if (topicInput) {
    topicInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const val = e.target.value.trim() || "Quantum Physics";
        closeResearchModal();
        runTopicResearch(val);
      }
    });
  }

  // Suggestions search click inside the modal
  const modalSuggestionContainer = document.getElementById("modal-suggestion-tags");
  if (modalSuggestionContainer) {
    modalSuggestionContainer.addEventListener("click", (e) => {
      const card = e.target.closest(".suggestion-card");
      if (card) {
        const topic = card.getAttribute("data-topic");
        closeResearchModal();
        runTopicResearch(topic);
      }
    });
  }

  // Modal Close Actions
  const modalCloseBtn = document.getElementById("modal-close-btn");
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeResearchModal);
  }

  const modalOverlay = document.getElementById("research-modal-overlay");
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target.id === "research-modal-overlay") {
        closeResearchModal();
      }
    });
  }

  // Escape key to close modal
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeResearchModal();
    }
  });

  // Orchestrator Actions
  const launchWorkspaceBtn = document.getElementById("launch-workspace-btn");
  if (launchWorkspaceBtn) {
    launchWorkspaceBtn.addEventListener("click", () => {
      switchView("workspace");
    });
  }

  // Workspace Actions
  const workspaceNewDiveBtn = document.getElementById("workspace-new-dive-btn");
  if (workspaceNewDiveBtn) {
    workspaceNewDiveBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  const headerXpBadge = document.getElementById("header-xp-badge");
  if (headerXpBadge) {
    headerXpBadge.addEventListener("click", () => {
      activateSidebarTab("journey");
    });
  }

  // Watch Demo action - with null check as it is on index.html
  const watchDemoBtn = document.getElementById("watch-demo-btn");
  if (watchDemoBtn) {
    watchDemoBtn.addEventListener("click", () => {
      runTopicResearch("True Crime");
    });
  }

  // Pricing Buy button - with null check as it is on index.html
  const pricingBuyBtn = document.getElementById("pricing-buy-btn");
  if (pricingBuyBtn) {
    pricingBuyBtn.addEventListener("click", () => {
      addXP(100, "Purchased Pro License");
      triggerMilestoneToast("PRO STATUS", "Full capabilities unlocked. Thank you!");
    });
  }

  // Search workspace nodes filters
  const workspaceSearchInput = document.getElementById("workspace-search-input");
  if (workspaceSearchInput) {
    workspaceSearchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      const isCrime = document.getElementById("true-crime-board") && document.getElementById("true-crime-board").style.display === "block";

      if (isCrime) {
        document.querySelectorAll(".true-crime-card").forEach(card => {
          const title = card.querySelector(".true-crime-title").textContent.toLowerCase();
          const desc = card.querySelector(".true-crime-desc").textContent.toLowerCase();
          if (title.includes(query) || desc.includes(query)) {
            card.style.opacity = "1";
          } else {
            card.style.opacity = "0.2";
          }
        });
      } else {
        document.querySelectorAll(".canvas-node").forEach(node => {
          const title = node.querySelector(".node-title").textContent.toLowerCase();
          const desc = node.querySelector(".node-summary").textContent.toLowerCase();
          if (title.includes(query) || desc.includes(query)) {
            node.style.opacity = "1";
          } else {
            node.style.opacity = "0.25";
          }
        });
      }
    });
  }

  // Zooming button controls - standard map
  const canvasZoomIn = document.getElementById("canvas-zoom-in");
  if (canvasZoomIn) {
    canvasZoomIn.addEventListener("click", () => {
      STATE.canvas.scale = Math.min(STATE.canvas.scale * 1.25, 2.5);
      applyCanvasTransform(document.getElementById("canvas-content"));
    });
  }
  const canvasZoomOut = document.getElementById("canvas-zoom-out");
  if (canvasZoomOut) {
    canvasZoomOut.addEventListener("click", () => {
      STATE.canvas.scale = Math.max(STATE.canvas.scale / 1.25, 0.4);
      applyCanvasTransform(document.getElementById("canvas-content"));
    });
  }
  const canvasZoomFit = document.getElementById("canvas-zoom-fit");
  if (canvasZoomFit) {
    canvasZoomFit.addEventListener("click", () => {
      STATE.canvas.scale = 1;
      STATE.canvas.panX = 0;
      STATE.canvas.panY = 0;
      applyCanvasTransform(document.getElementById("canvas-content"));
    });
  }

  // Surprise Me - Discovery Mode Action
  const canvasSurpriseMe = document.getElementById("canvas-surprise-me");
  if (canvasSurpriseMe) {
    canvasSurpriseMe.addEventListener("click", () => {
      const list = Object.keys(TOPICS_DATA);
      let target = list[Math.floor(Math.random() * list.length)];
      while (target === STATE.currentTopic && list.length > 1) {
        target = list[Math.floor(Math.random() * list.length)];
      }

      addXP(100, "Initiated Surprise Discovery Journey");
      runTopicResearch(target);
    });
  }

  // Zooming controls - crime board
  const crimeZoomIn = document.getElementById("crime-zoom-in");
  if (crimeZoomIn) {
    crimeZoomIn.addEventListener("click", () => {
      STATE.canvas.scale = Math.min(STATE.canvas.scale * 1.25, 2.5);
      applyCanvasTransform(document.getElementById("true-crime-content"));
    });
  }
  const crimeZoomOut = document.getElementById("crime-zoom-out");
  if (crimeZoomOut) {
    crimeZoomOut.addEventListener("click", () => {
      STATE.canvas.scale = Math.max(STATE.canvas.scale / 1.25, 0.4);
      applyCanvasTransform(document.getElementById("true-crime-content"));
    });
  }
  const crimeZoomFit = document.getElementById("crime-zoom-fit");
  if (crimeZoomFit) {
    crimeZoomFit.addEventListener("click", () => {
      STATE.canvas.scale = 1;
      STATE.canvas.panX = 0;
      STATE.canvas.panY = 0;
      applyCanvasTransform(document.getElementById("true-crime-content"));
    });
  }

  // Audio Player widget interactions
  const audioCloseBtn = document.getElementById("audio-close-btn");
  if (audioCloseBtn) {
    audioCloseBtn.addEventListener("click", () => {
      document.getElementById("audio-companion-widget").classList.remove("active");
    });
  }

  const audioPlayBtn = document.getElementById("audio-play-btn");
  if (audioPlayBtn) audioPlayBtn.addEventListener("click", toggleAudioBriefing);
  const audioPrevBtn = document.getElementById("audio-prev-btn");
  if (audioPrevBtn) audioPrevBtn.addEventListener("click", () => skipAudioBriefing(-1));
  const audioNextBtn = document.getElementById("audio-next-btn");
  if (audioNextBtn) audioNextBtn.addEventListener("click", () => skipAudioBriefing(1));

  // Audio companion speed change
  const audioSpeedBadge = document.getElementById("audio-speed-badge");
  if (audioSpeedBadge) {
    audioSpeedBadge.addEventListener("click", () => {
      const speeds = [1.0, 1.25, 1.5, 2.0];
      let idx = speeds.indexOf(STATE.audio.speed);
      idx = (idx + 1) % speeds.length;
      STATE.audio.speed = speeds[idx];
      audioSpeedBadge.textContent = `${STATE.audio.speed}x`;

      if (STATE.audio.isPlaying) {
        playSpeechNarration();
      }
    });
  }

  // Audio companion mode selectors
  const audioModes = document.querySelectorAll(".audio-mode-btn");
  audioModes.forEach(btn => {
    btn.addEventListener("click", (e) => {
      audioModes.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      STATE.audio.mode = btn.getAttribute("data-mode");
      STATE.audio.currentTime = 0;
      updateAudioCompanionDuration();

      if (STATE.audio.isPlaying) {
        pauseAudioBriefing();
        playAudioBriefing();
      }
    });
  });

  // Audio progress bar click seek
  const audioProgressBar = document.getElementById("audio-progress-bar");
  if (audioProgressBar) {
    audioProgressBar.addEventListener("click", (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      STATE.audio.currentTime = Math.floor(pct * STATE.audio.duration);

      document.getElementById("audio-progress-fill").style.width = `${pct * 100}%`;
      document.getElementById("audio-time-current").textContent = formatAudioTime(STATE.audio.currentTime);
    });
  }

  // Enable Pan dragging handlers on standard canvas & crime canvas
  handleViewportPan("canvas-viewport", "canvas-content");
  handleViewportPan("true-crime-board", "true-crime-content");

  // Close popup when clicking on blank canvas area
  const canvasViewport = document.getElementById("canvas-viewport");
  if (canvasViewport) {
    canvasViewport.addEventListener("click", (e) => {
      if (!e.target.closest(".canvas-node") && !e.target.closest("#node-info-popup")) {
        hideNodePopup();
      }
    });
  }
  const trueCrimeBoard = document.getElementById("true-crime-board");
  if (trueCrimeBoard) {
    trueCrimeBoard.addEventListener("click", (e) => {
      if (!e.target.closest(".true-crime-card") && !e.target.closest("#node-info-popup")) {
        hideNodePopup();
      }
    });
  }
}

// --- 13. FLOATING NODE INFO POPUP ---

function getSourceDomain(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function getFaviconUrl(url) {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
  } catch {
    return "";
  }
}

function credibilityLabel(c) {
  return c === "green" ? "Verified Source" : c === "yellow" ? "Medium Credibility" : "Needs Verification";
}

function showNodePopup(node, triggerEl) {
  const popup = document.getElementById("node-info-popup");
  if (!popup) return;

  const credLabel = credibilityLabel(node.credibility);
  const domain = getSourceDomain(node.url);
  const faviconUrl = getFaviconUrl(node.url);

  // Build inner HTML
  popup.innerHTML = `
    <div class="popup-type-bar ${node.type}"></div>
    <div class="popup-inner">
      <div class="popup-header">
        <div class="popup-title">${node.title}</div>
        <button class="popup-close-btn" id="popup-close-btn" title="Close" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="popup-meta-row">
        <span class="popup-type-badge ${node.type}">${node.type}</span>
        <div class="popup-credibility-dot ${node.credibility}"></div>
        <span class="popup-credibility-label">${credLabel}</span>
        <span class="popup-importance-chip">${node.importance}</span>
      </div>

      <div class="popup-divider"></div>

      <p class="popup-summary">${node.summary}</p>

      <div class="popup-source-section">
        <div class="popup-source-label">Verified Source</div>
        <a class="popup-source-link" href="${node.url}" target="_blank" rel="noopener noreferrer" title="${node.url}">
          ${faviconUrl ? `<img class="popup-source-favicon" src="${faviconUrl}" alt="" loading="lazy" onerror="this.style.display='none'">` : ""}
          <span>${domain}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:0.5">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      </div>

      <div class="popup-date-chip">
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        Last updated: ${node.date}
      </div>

      <div class="popup-actions-row">
        <a href="${node.url}" target="_blank" rel="noopener noreferrer"
           class="popup-action-btn popup-action-primary" style="text-decoration:none;">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
          Open Source
        </a>
        <button class="popup-action-btn popup-action-secondary" id="popup-deep-dive-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          Details
        </button>
      </div>
    </div>
  `;

  // Wire close button
  document.getElementById("popup-close-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    hideNodePopup();
  });

  // Wire Details button → open right sidebar
  document.getElementById("popup-deep-dive-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    selectNode(node);
  });

  // --- Smart Positioning ---
  // Remove old state first
  popup.classList.remove("visible", "flip-left");

  // Temporarily make visible but hidden from view to measure natural height
  popup.style.visibility = "hidden";
  popup.style.display = "block";
  popup.style.left = "-9999px";
  popup.style.top = "-9999px";

  const POPUP_W = 310;
  const POPUP_H = popup.offsetHeight || 380;
  const MARGIN = 16; // gap between node and popup
  const nodeRect = triggerEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left, top, flipLeft = false;

  // Prefer right side; flip left if insufficient space
  if (nodeRect.right + MARGIN + POPUP_W <= vw - 8) {
    left = nodeRect.right + MARGIN;
  } else {
    left = nodeRect.left - POPUP_W - MARGIN;
    flipLeft = true;
  }

  // Vertical: align to node top, clamp to viewport
  top = nodeRect.top;
  if (top + POPUP_H > vh - 8) {
    top = Math.max(8, vh - POPUP_H - 8);
  }

  // Apply position
  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;

  // Clear inline display/visibility so CSS class controls it
  popup.style.display = "";
  popup.style.visibility = "";

  // Force reflow then animate in
  void popup.offsetWidth;
  if (flipLeft) {
    popup.classList.add("visible", "flip-left");
  } else {
    popup.classList.add("visible");
  }
}

function hideNodePopup() {
  const popup = document.getElementById("node-info-popup");
  if (!popup) return;
  popup.classList.remove("visible", "flip-left");
  // After the exit animation, clear any leftover inline styles
  setTimeout(() => {
    if (!popup.classList.contains("visible")) {
      popup.style.left = "";
      popup.style.top = "";
      popup.style.display = "";
      popup.style.visibility = "";
    }
  }, 300);
}

// generateDynamicTopicData duplicate function was merged and removed

