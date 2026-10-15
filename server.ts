import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { translateBjjTitle } from './src/utils/bjjAnalyzer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory cache to prevent redundant Gemini API calls
const translationCache = new Map<string, string>();

// Cooldown timestamp when rate limits (429) or high demand (503) occur
let aiCooldownUntil = 0;

// Initialize Gemini client on the server side using the modern @google/genai SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Translates a BJJ video title into 100% natural, idiomatic, professional Korean terminology.
 * Completely eliminates awkward mixed English words (e.g. 'the', 'every time', 'finish').
 * Resilient against free-tier rate limits (429) and server spikes (503) with seamless algorithmic fallback.
 */
async function translateBjjTitleWithAI(title: string): Promise<string> {
  const clean = (title || '').trim();
  if (!clean) return '';

  // 1. Check in-memory cache first
  if (translationCache.has(clean)) {
    return translationCache.get(clean)!;
  }

  // Fallback translation generated algorithmically
  const algorithmicFallback = translateBjjTitle(clean).titleKo || clean;

  // 2. If in cooldown or API key is missing, immediately use the high-quality algorithmic fallback
  if (Date.now() < aiCooldownUntil || !process.env.GEMINI_API_KEY) {
    translationCache.set(clean, algorithmicFallback);
    return algorithmicFallback;
  }

  const prompt = `Translate this BJJ technique video title into one single concise, natural Korean title: "${clean}"

Strict Rules:
1. Translate or localize ALL English words (e.g. 'the', 'how to', 'finish', 'every time', 'drills', 'breakdown', 'americana', 'kimura', etc.) into 100% natural Korean terminology.
2. Absolutely DO NOT leave English words mixed in the Korean text.
3. Output ONLY the single final translated title string directly.
4. NO explanation, NO bullet points, NO quotes, NO markdown formatting, NO alternative options. Just the single title.`;

  let candidate = '';
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });
    candidate = response.text ? response.text.trim() : '';
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    const isRateLimit =
      errMsg.includes('429') ||
      errMsg.includes('RESOURCE_EXHAUSTED') ||
      errMsg.includes('quota') ||
      errMsg.includes('503') ||
      errMsg.includes('UNAVAILABLE') ||
      err?.status === 429;

    if (isRateLimit) {
      // Free tier rate limit or server busy: pause AI calls for 60s and smoothly serve algorithmic translations
      aiCooldownUntil = Date.now() + 60000;
    }
    translationCache.set(clean, algorithmicFallback);
    return algorithmicFallback;
  }

  if (!candidate) {
    translationCache.set(clean, algorithmicFallback);
    return algorithmicFallback;
  }

  // Extract cleanest single title from AI response (strip quotes, bullets, markdown)
  const quoteMatch = candidate.match(/["'“]([^"'”\n]+)["'”]/);
  let finalTitle = quoteMatch ? quoteMatch[1] : candidate;

  // If there are multiple lines, pick the first line that looks like a Korean title
  const lines = finalTitle.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  for (const line of lines) {
    const cleanLine = line
      .replace(/^[\s>•*-]+/, '')
      .replace(/^[\d]+[\.\)]\s*/, '')
      .replace(/\*\*/g, '')
      .replace(/^["'`“”]|["'`“”]$/g, '')
      .replace(/^(한국어|번역|제목)\s*:\s*/i, '')
      .trim();

    if (
      cleanLine.length > 1 &&
      !cleanLine.startsWith('문맥') &&
      !cleanLine.startsWith('참고') &&
      !cleanLine.startsWith('팁:')
    ) {
      finalTitle = cleanLine;
      break;
    }
  }

  finalTitle = finalTitle
    .replace(/^[\s>•*-]+/, '')
    .replace(/\*\*/g, '')
    .replace(/^["'`“”]|["'`“”]$/g, '')
    .trim();

  const finalResult = finalTitle || algorithmicFallback;
  translationCache.set(clean, finalResult);
  return finalResult;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Dedicated AI Translation Endpoint for 100% Natural Korean BJJ Titles
  app.post('/api/translate-title', async (req, res) => {
    const { title } = req.body || {};
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'title parameter is required' });
    }

    const cleanTitle = title.trim();
    try {
      const titleKo = await translateBjjTitleWithAI(cleanTitle);
      return res.json({
        success: true,
        titleEn: cleanTitle,
        titleKo: titleKo || translateBjjTitle(cleanTitle).titleKo,
      });
    } catch {
      return res.json({
        success: true,
        titleEn: cleanTitle,
        titleKo: translateBjjTitle(cleanTitle).titleKo,
      });
    }
  });

  // API endpoint to fetch YouTube / Instagram video metadata without CORS limitations
  app.get('/api/video-info', async (req, res) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
      const cleanUrl = rawUrl.trim();
      const ytMatch = cleanUrl.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
      );
      const ytId = ytMatch ? ytMatch[1] : null;

      const igMatch = cleanUrl.match(
        /(?:instagram\.com|instagr\.am)(?:\/[^/?#\s]+)*\/(?:p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/i
      );
      const igId = igMatch ? igMatch[1] : null;

      const canonicalUrl = ytId
        ? `https://www.youtube.com/watch?v=${ytId}`
        : igId
          ? `https://www.instagram.com/reel/${igId}/`
          : cleanUrl;

      const sendVideoInfo = async (title: string, author = '', thumbnailUrl = '') => {
        const cleanTitle = title.trim();
        let titleKo = '';
        try {
          titleKo = await translateBjjTitleWithAI(cleanTitle);
        } catch {
          // ignore
        }
        return res.json({
          success: true,
          title: cleanTitle,
          titleKo: titleKo || '',
          author: author || '',
          thumbnailUrl: thumbnailUrl || (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : ''),
        });
      };

      // 1. Try noembed.com
      try {
        const noembedRes = await fetch(
          `https://noembed.com/embed?url=${encodeURIComponent(canonicalUrl)}`
        );
        if (noembedRes.ok) {
          const data = (await noembedRes.json()) as any;
          if (data && typeof data.title === 'string' && data.title.trim().length > 0) {
            return await sendVideoInfo(data.title, data.author_name || '', data.thumbnail_url);
          }
        }
      } catch {
        // Fall through to next method
      }

      // 2. Try YouTube official oEmbed
      if (ytId || canonicalUrl.includes('youtube.com') || canonicalUrl.includes('youtu.be')) {
        try {
          const ytRes = await fetch(
            `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`,
            {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Accept: 'application/json',
              },
            }
          );
          if (ytRes.ok) {
            const data = (await ytRes.json()) as any;
            if (data && typeof data.title === 'string' && data.title.trim().length > 0) {
              return await sendVideoInfo(data.title, data.author_name || '', data.thumbnail_url);
            }
          }
        } catch {
          // Fall through to next method
        }
      }

      // 3. Fallback: fetch HTML page metadata directly (og:title, meta[name=title], or <title>)
      try {
        const pageRes = await fetch(canonicalUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          },
        });
        if (pageRes.ok) {
          const html = await pageRes.text();
          // Check og:title
          const ogMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
            html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:title["']/i);
          let candidate = ogMatch ? ogMatch[1] : '';

          if (!candidate) {
            const nameTitleMatch = html.match(/<meta\s+name=["']title["']\s+content=["'](.*?)["']/i) ||
              html.match(/<meta\s+content=["'](.*?)["']\s+name=["']title["']/i);
            candidate = nameTitleMatch ? nameTitleMatch[1] : '';
          }

          if (!candidate) {
            const titleTagMatch = html.match(/<title>(.*?)<\/title>/i);
            candidate = titleTagMatch ? titleTagMatch[1] : '';
          }

          if (candidate) {
            const raw = candidate
              .replace(/ - YouTube$/i, '')
              .replace(/ \| YouTube$/i, '')
              .replace(/ • YouTube$/i, '')
              .replace(/ \| Instagram$/i, '')
              .replace(/ - Instagram$/i, '')
              .trim();
            if (raw.length > 0 && !raw.includes('404 Not Found') && !raw.includes('Before you continue to YouTube')) {
              return await sendVideoInfo(raw, '', ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : '');
            }
          }
        }
      } catch {
        // Fall through
      }

      return res.status(404).json({ error: 'Failed to fetch video title' });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Server error fetching video title' });
    }
  });

  // In development, mount Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BJJ Archive server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
