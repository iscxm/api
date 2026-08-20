module.exports = async (req, res) => {
    // ──────────────────────────────────────────────────────────────
    // Strict Vidssave API Extraction - Built for VPS / Unblocked IP
    // ──────────────────────────────────────────────────────────────
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.query.ping === 'true' || req.query.q === 'ping' || Object.keys(req.query).length === 0) {
        return res.status(200).json({ status: "API is online and running!", ping: "pong", timestamp: Date.now() });
    }

    const query = req.query.q || req.query.query;
    const formatType = req.query.format || 'audio';

    if (!query) {
        return res.status(400).json({ error: "Please provide a query or YouTube link (?q=)" });
    }

    const WEB_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

    const extractVideoId = (text) => {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = text.match(regex);
        return match ? match[1] : null;
    };

    try {
        let videoId = extractVideoId(query);
        let title = "Unknown Title";
        let thumbnail = "https://i.ibb.co/3vkbQ1c/default-cover.png";
        let streamUrl = null;
        let successClient = null;
        
        // 1. Search via HTML Scrape (Bypasses API blocks)
        if (!videoId) {
            const searchHtml = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
                headers: {
                    "User-Agent": WEB_UA,
                    "Accept-Language": "en-US,en;q=0.9",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                    "Referer": "https://www.youtube.com/",
                    "Sec-Ch-Ua": '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
                    "Sec-Ch-Ua-Mobile": "?0",
                    "Sec-Ch-Ua-Platform": '"Windows"',
                    "Sec-Fetch-Dest": "document",
                    "Sec-Fetch-Mode": "navigate",
                    "Sec-Fetch-Site": "same-origin",
                    "Upgrade-Insecure-Requests": "1"
                }
            });
            const htmlText = await searchHtml.text();
            
            const match = htmlText.match(/ytInitialData\s*=\s*({.+?});/);
            if (!match) throw new Error("Search failed: Could not parse YouTube response.");
            
            const data = JSON.parse(match[1]);
            
            let found = false;
            const sections = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
            for (const sec of sections) {
                const items = sec?.itemSectionRenderer?.contents || [];
                for (const item of items) {
                    const v = item?.videoRenderer;
                    if (!v || !v.videoId) continue;
                    if (v.badges?.some(b => b?.metadataBadgeRenderer?.style === "BADGE_STYLE_TYPE_LIVE_NOW")) continue;
                    
                    videoId = v.videoId;
                    title = v.title?.runs?.[0]?.text || title;
                    const thumbs = v.thumbnail?.thumbnails || [];
                    thumbnail = (thumbs[thumbs.length - 1]?.url || thumbnail).split("?")[0];
                    found = true;
                    break;
                }
                if (found) break;
            }
            if (!found) throw new Error("Could not find the requested song/video.");
        }

        // 2. Extract Stream Info STRICTLY via Vidssave
        try {
            const vsUrl = "https://api.vidssave.com/api/contentsite_api/media/parse";
            const vsBody = `auth=20250901majwlqo&domain=api-ak.vidssave.com&origin=source&link=${encodeURIComponent("https://youtu.be/" + videoId)}`;
            
            const vsRes = await fetch(vsUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": WEB_UA,
                    "Origin": "https://vidssave.com",
                    "Referer": "https://vidssave.com/",
                    "Accept": "application/json, text/plain, */*",
                    "Sec-Fetch-Site": "same-site",
                    "Sec-Fetch-Mode": "cors"
                },
                body: vsBody
            });
            
            if (vsRes.ok) {
                const vsData = await vsRes.json();
                
                if (vsData?.data) {
                    if (extractVideoId(query)) {
                        title = vsData.data.title || title;
                        thumbnail = vsData.data.thumbnail || thumbnail;
                    }

                    const media = vsData.data.media || [];
                    for (const m of media) {
                        for (const res of m.resources) {
                            if (formatType === 'audio' && res.type === 'audio' && res.download_url && res.download_url.includes('googlevideo.com')) {
                                streamUrl = res.download_url;
                            }
                            if (formatType === 'video' && res.type === 'video' && res.download_url && res.download_url.includes('googlevideo.com')) {
                                streamUrl = res.download_url;
                            }
                        }
                    }
                }
                if (streamUrl) successClient = "VIDSSAVE_BYPASS";
            }
        } catch (e) {
            console.log("Vidssave fallback failed", e.message);
        }
        
        if (!streamUrl) {
            throw new Error(`Failed to extract stream for video using Vidssave API. Your IP is blocked by Cloudflare.`);
        }

        return res.status(200).json({
            success: true,
            title: title,
            thumbnail: thumbnail,
            stream_url: streamUrl,
            client_used: successClient
        });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};
