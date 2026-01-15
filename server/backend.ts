// Compatibility entrypoint.
// Some deployment configs start `server/backend.ts`.
// The full API (chat/analyze/submit + Vercel-friendly CORS) lives in `server/index.ts`.
import './index';
