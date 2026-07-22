import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

// Disable Next's default body parser for formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

type UploadResponse = {
  id?: number;
  status?: string;
  message?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<UploadResponse>) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const form = new formidable.IncomingForm({ multiples: true, maxFileSize: 200 * 1024 * 1024 });
  try {
    const parsed: any = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const { fields, files } = parsed;
    const name = fields.name;
    const description = fields.description || '';
    const type = fields.type || 'Model';
    const creatorType = fields.creatorType || 'User';
    const groupId = fields.groupId;

    if (!name) return res.status(400).json({ message: 'Missing name' });

    const uploadedFiles = Array.isArray(files.file) ? files.file : [files.file];
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const robloxForm = new FormData();
    robloxForm.append('name', name);
    robloxForm.append('description', description);
    robloxForm.append('type', type);
    if (creatorType === 'Group' && groupId) {
      robloxForm.append('groupId', String(groupId));
    }

    for (const f of uploadedFiles) {
      const path = f.filepath || f.path || f.file;
      const filename = f.originalFilename || f.name || 'upload.bin';
      const fileStream = fs.createReadStream(path);
      robloxForm.append('file', fileStream, { filename });
    }

    const ROBLOX_ASSETS_ENDPOINT = 'https://apis.roblox.com/assets/v1/assets';
    const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
    if (!ROBLOX_API_KEY) return res.status(500).json({ message: 'Server configuration error: missing API key' });

    const headers = {
      ...robloxForm.getHeaders(),
      'x-api-key': ROBLOX_API_KEY,
    };

    const robloxResp = await axios.post(ROBLOX_ASSETS_ENDPOINT, robloxForm, {
      headers,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      validateStatus: (status) => status < 500,
    });

    for (const f of uploadedFiles) {
      try { fs.unlinkSync(f.filepath || f.path); } catch (e) { /* ignore */ }
    }

    if (robloxResp.status === 200 || robloxResp.status === 201) {
      const data = robloxResp.data;
      return res.status(200).json({ id: data.id, status: data.status });
    } else {
      const errMsg = robloxResp.data?.message || robloxResp.data?.error || `Roblox API responded with status ${robloxResp.status}`;
      return res.status(robloxResp.status).json({ message: errMsg });
    }
  } catch (err:any) {
    console.error('Upload error', err);
    return res.status(500).json({ message: err?.message || 'Upload failed' });
  }
}
