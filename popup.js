// Site personality mapping with expanded database
const sitePersonalityMap = {
    "youtube.com": { personality: "extrovert", privacy: "low", category: "social", weight: 2 },
    "facebook.com": { personality: "extrovert", privacy: "low", category: "social", weight: 3 },
    "instagram.com": { personality: "extrovert", privacy: "low", category: "social", weight: 3 },
    "twitter.com": { personality: "extrovert", privacy: "low", category: "social", weight: 2 },
    "tiktok.com": { personality: "extrovert", privacy: "low", category: "social", weight: 3 },
    "snapchat.com": { personality: "extrovert", privacy: "low", category: "social", weight: 2 },
    "pinterest.com": { personality: "ambivert", privacy: "medium", category: "social", weight: 1 },
    "linkedin.com": { personality: "ambivert", privacy: "medium", category: "professional", weight: 2 },
    "medium.com": { personality: "ambivert", privacy: "medium", category: "professional", weight: 2 },
    "behance.net": { personality: "ambivert", privacy: "medium", category: "professional", weight: 1 },
    "github.com": { personality: "introvert", privacy: "high", category: "tech", weight: 3 },
    "stackoverflow.com": { personality: "introvert", privacy: "medium", category: "tech", weight: 2 },
    "dev.to": { personality: "introvert", privacy: "medium", category: "tech", weight: 2 },
    "hackernews.ycombinator.com": { personality: "introvert", privacy: "high", category: "tech", weight: 3 },
    "gitlab.com": { personality: "introvert", privacy: "high", category: "tech", weight: 2 },
    "codepen.io": { personality: "ambivert", privacy: "medium", category: "tech", weight: 1 },
    "reddit.com": { personality: "ambivert", privacy: "medium", category: "social", weight: 3 },
    "quora.com": { personality: "ambivert", privacy: "medium", category: "social", weight: 2 },
    "discord.com": { personality: "ambivert", privacy: "medium", category: "social", weight: 2 },
    "duckduckgo.com": { personality: "introvert", privacy: "high", category: "privacy", weight: 3 },
    "protonmail.com": { personality: "introvert", privacy: "high", category: "privacy", weight: 3 },
    "signal.org": { personality: "introvert", privacy: "high", category: "privacy", weight: 3 },
    "tor.org": { personality: "introvert", privacy: "high", category: "privacy", weight: 3 },
    "startpage.com": { personality: "introvert", privacy: "high", category: "privacy", weight: 2 },
    "twitch.tv": { personality: "extrovert", privacy: "low", category: "social", weight: 2 },
    "netflix.com": { personality: "ambivert", privacy: "low", category: "social", weight: 1 },
    "spotify.com": { personality: "ambivert", privacy: "low", category: "social", weight: 1 },
    "wikipedia.org": { personality: "introvert", privacy: "high", category: "tech", weight: 1 },
    "news.ycombinator.com": { personality: "introvert", privacy: "high", category: "tech", weight: 2 },
    "google.com": { personality: "ambivert", privacy: "low", category: "search", weight: 1 },
    "gmail.com": { personality: "ambivert", privacy: "low", category: "professional", weight: 1 },
    "outlook.com": { personality: "ambivert", privacy: "medium", category: "professional", weight: 1 }
};

let currentAnalysis = null;

// DOM Elements
const analyzeBtn = document.getElementById('analyzeBtn');
const reanalyzeBtn = document.getElementById('reanalyzeBtn');
const exportBtn = document.getElementById('exportBtn');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('results');
const historyRange = document.getElementById('historyRange');

// Event Listeners
analyzeBtn.addEventListener('click', startAnalysis);
reanalyzeBtn.addEventListener('click', startAnalysis);
exportBtn.addEventListener('click', exportResults);

// Main analysis function
async function startAnalysis() {
    showLoading();
    try {
        const days = parseInt(historyRange.value);
        const historyData = await getHistoryData(days);
        const analysis = analyzePersonality(historyData);
        
        setTimeout(() => {
            displayResults(analysis);
            currentAnalysis = analysis;
            hideLoading();
        }, 2000);
    } catch (error) {
        console.error('Analysis failed:', error);
        hideLoading();
        alert('Failed to analyze browsing history.');
    }
}

// Get browsing history data
function getHistoryData(days) {
    return new Promise((resolve, reject) => {
        const millisecondsAgo = days * 24 * 60 * 60 * 1000;
        const startTime = Date.now() - millisecondsAgo;
        
        chrome.history.search({
            text: '',
            startTime: startTime,
            maxResults: 1000
        }, (historyItems) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(historyItems);
            }
        });
    });
}

// Analyze personality from history data
function analyzePersonality(historyData) {
    const siteFrequency = {};
    const categoryCounts = { social: 0, tech: 0, professional: 0, privacy: 0 };
    const personalityCounts = { introvert: 0, extrovert: 0, ambivert: 0 };
    const privacyCounts = { low: 0, medium: 0, high: 0 };
    
    let totalVisits = 0;
    let analyzedSites = [];
    
    historyData.forEach(item => {
        try {
            const url = new URL(item.url);
            const domain = url.hostname.replace(/^www\./, '');
            const visitCount = item.visitCount || 1;
            
            siteFrequency[domain] = (siteFrequency[domain] || 0) + visitCount;
            totalVisits += visitCount;
            
            if (sitePersonalityMap[domain]) {
                const siteData = sitePersonalityMap[domain];
                const weight = siteData.weight * visitCount;
                
                personalityCounts[siteData.personality] += weight;
                privacyCounts[siteData.privacy] += weight;
                categoryCounts[siteData.category] += weight;
                
                analyzedSites.push({
                    domain,
                    visits: visitCount,
                    category: siteData.category,
                    personality: siteData.personality,
                    privacy: siteData.privacy
                });
            }
        } catch (e) {}
    });
    
    const predictedPersonality = getMaxKey(personalityCounts);
    const predictedPrivacy = getMaxKey(privacyCounts);
    const dominantCategory = getMaxKey(categoryCounts);
    
    const totalWeights = Object.values(personalityCounts).reduce((a, b) => a + b, 0);
    const socialPercentage = Math.round((categoryCounts.social / totalWeights) * 100) || 0;
    const techPercentage = Math.round((categoryCounts.tech / totalWeights) * 100) || 0;
    const privacyPercentage = Math.round((categoryCounts.privacy / totalWeights) * 100) || 0;
    
    const topSites = Object.entries(siteFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([domain, visits]) => ({
            domain,
            visits,
            category: sitePersonalityMap[domain]?.category || 'other'
        }));
    
    return {
        personality: predictedPersonality,
        privacy: predictedPrivacy,
        behavior: dominantCategory,
        stats: {
            totalSites: Object.keys(siteFrequency).length,
            analyzedSites: analyzedSites.length,
            socialScore: socialPercentage,
            techScore: techPercentage,
            privacyScore: privacyPercentage,
            totalVisits
        },
        topSites,
        analyzedSites,
        insight: generateInsight(predictedPersonality, predictedPrivacy, dominantCategory, {
            socialScore: socialPercentage,
            techScore: techPercentage,
            privacyScore: privacyPercentage
        })
    };
}

function getMaxKey(obj) {
    return Object.keys(obj).reduce((a, b) => obj[a] > obj[b] ? a : b);
}

function generateInsight(personality, privacy, behavior, scores) {
    let insight = "";
    if (personality === "extrovert") {
        insight = "You're digitally outgoing and love connecting with others online. ";
        if (scores.socialScore > 50) {
            insight += "Your high social media activity shows you enjoy sharing experiences and engaging with communities. ";
        }
    } else if (personality === "introvert") {
        insight = "You prefer focused, meaningful digital interactions. ";
        if (scores.techScore > 40) {
            insight += "Your technical site usage suggests you enjoy deep-diving into specialized topics. ";
        }
    } else {
        insight = "You have a balanced digital personality, adapting your behavior based on context. ";
    }
    if (privacy === "high") {
        insight += "You're highly privacy-conscious and likely choose platforms that respect user data. ";
    } else if (privacy === "low") {
        insight += "You're comfortable with data sharing in exchange for personalized experiences. ";
    }
    if (scores.privacyScore > 20) {
        insight += "Your privacy-focused browsing shows you value digital security.";
    }
    return insight.trim();
}

function displayResults(analysis) {
    document.getElementById('personalityResult').textContent = analysis.personality;
    document.getElementById('privacyResult').textContent = analysis.privacy;
    document.getElementById('behaviorResult').textContent = analysis.behavior;
    document.getElementById('insightText').textContent = analysis.insight;
    
    document.getElementById('totalSites').textContent = analysis.stats.totalSites;
    document.getElementById('socialScore').textContent = analysis.stats.socialScore + '%';
    document.getElementById('techScore').textContent = analysis.stats.techScore + '%';
    document.getElementById('privacyScore').textContent = analysis.stats.privacyScore + '%';
    
    const sitesList = document.getElementById('sitesList');
    sitesList.innerHTML = analysis.topSites
        .slice(0, 8)
        .map(site => `<span class="site-tag ${site.category}">${site.domain}</span>`)
        .join('');
    
    resultsSection.classList.remove('hidden');
}

function showLoading() {
    analyzeBtn.disabled = true;
    analyzeBtn.querySelector('.btn-text').classList.add('hidden');
    analyzeBtn.querySelector('.spinner').classList.remove('hidden');
    loadingSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
}

function hideLoading() {
    analyzeBtn.disabled = false;
    analyzeBtn.querySelector('.btn-text').classList.remove('hidden');
    analyzeBtn.querySelector('.spinner').classList.add('hidden');
    loadingSection.classList.add('hidden');
}

function exportResults() {
    console.log('Export button clicked');
    if (!currentAnalysis) {
        console.log('No analysis available.');
        alert('No analysis available to export.');
        return;
    }
    
    console.log('Preparing export...');
    const exportData = {
        timestamp: new Date().toISOString(),
        analysis: currentAnalysis,
        summary: {
            personality: currentAnalysis.personality,
            privacy: currentAnalysis.privacy,
            behavior: currentAnalysis.behavior,
            insight: currentAnalysis.insight
        }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personality-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('Download triggered.');
}

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['lastAnalysis'], (result) => {
        if (result.lastAnalysis) {
            currentAnalysis = result.lastAnalysis;
            displayResults(currentAnalysis);
            hideLoading();
        }
    });
});
