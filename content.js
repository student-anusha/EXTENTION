(function() {
    'use strict';
    
    // Enhanced site detection patterns
    const sitePatterns = {
        social: [
            /facebook\.com/,
            /instagram\.com/,
            /twitter\.com/,
            /snapchat\.com/,
            /pinterest\.com/,
            /linkedin\.com/
        ],
        tech: [
            /github\.com/,
            /stackoverflow\.com/,
            /dev\.to/,
            /hackernews/,
            /gitlab\.com/,
            /codepen\.io/,
            /repl\.it/
        ],
        privacy: [
            /duckduckgo\.com/,
            /protonmail\.com/,
            /signal\.org/,
            /tor\.org/,
            /startpage\.com/,
            /brave\.com/
        ],
        professional: [
            /medium\.com/,
            /behance\.net/,
            /dribbble\.com/,
            /slideshare\.net/
        ]
    };
    
    // Detect current site category
    function detectSiteCategory() {
        const hostname = window.location.hostname.replace(/^www\./, '');
        
        for (const [category, patterns] of Object.entries(sitePatterns)) {
            if (patterns.some(pattern => pattern.test(hostname))) {
                return category;
            }
        }
        return 'other';
    }
    
    // Track user engagement metrics
    let startTime = Date.now();
    let scrollDepth = 0;
    let clicks = 0;
    
    // Scroll tracking
    window.addEventListener('scroll', () => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const currentScroll = window.pageYOffset;
        scrollDepth = Math.max(scrollDepth, (currentScroll / maxScroll) * 100);
    });
    
    // Click tracking
    document.addEventListener('click', () => {
        clicks++;
    });
    
    // Send engagement data when page unloads
    window.addEventListener('beforeunload', () => {
        const timeSpent = Date.now() - startTime;
        const category = detectSiteCategory();
        
        const engagementData = {
            hostname: window.location.hostname.replace(/^www\./, ''),
            category: category,
            timeSpent: timeSpent,
            scrollDepth: Math.round(scrollDepth),
            clicks: clicks,
            timestamp: Date.now()
        };
        
        // Send to extension background
        chrome.runtime.sendMessage({
            action: 'recordEngagement',
            data: engagementData
        }).catch(() => {
            // Ignore errors if extension context is invalid
        });
    });
    
    // Detect if user is in incognito mode
    chrome.extension.isAllowedIncognitoAccess((isAllowed) => {
        if (isAllowed && chrome.extension.inIncognitoContext) {
            // User is in incognito mode - this affects privacy scoring
            chrome.runtime.sendMessage({
                action: 'incognitoDetected',
                timestamp: Date.now()
            }).catch(() => {});
        }
    });
})();