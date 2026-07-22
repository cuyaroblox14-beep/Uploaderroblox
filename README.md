# Uploaderroblox

This branch adds a basic UGC upload flow for Roblox using the Roblox Open Cloud Assets API.

Files added:
- `components/UGCUpload.tsx` — React component (Next.js + Tailwind) for drag-and-drop uploads and cost estimation
- `pages/api/ugc/upload.ts` — Server-side API route that forwards multipart/form-data to Roblox Assets API (requires ROBLOX_API_KEY)
- `pages/api/ugc/estimate.ts` — Simple fee estimator endpoint
- `.env.example` — example environment variables

Important notes
- You MUST set `ROBLOX_API_KEY` in your environment (use a secrets manager or .env on local dev). Never expose this key to the client.
- Verify Roblox fields and allowed asset types against the official docs: https://create.roblox.com/docs/cloud/guides/usage-assets
- For production, implement robust balance checks, group permission verification, moderation polling, and rate-limit handling.

How to use
1. Create a branch or merge this branch into your mainline.
2. Install dependencies: `npm install axios form-data formidable react-dropzone framer-motion`
3. Add `.env.local` containing `ROBLOX_API_KEY=your_key_here`
4. Use the `components/UGCUpload.tsx` component in a page (e.g., `pages/upload.tsx`).

Next steps
- Add polling or webhook handling for asset moderation status.
- Implement server-side Robux balance checks using Roblox Economy endpoints with proper auth.
- Harden validation and size limits, and implement storage cleanup and audit logging.
