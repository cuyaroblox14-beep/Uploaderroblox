import React, {useState, useCallback} from 'react';
import {useDropzone} from 'react-dropzone';
import axios from 'axios';
import {motion} from 'framer-motion';

/**
 * UGCUpload component
 * - Tailwind CSS classes used for styling
 * - Expects endpoints: /api/ugc/estimate and /api/ugc/upload
 */

type AssetType = 'Hat' | 'Back' | 'Face' | 'Shoulder' | 'Model' | 'Image';

const FEE_TABLE: Record<AssetType, number> = {
  Hat: 750,
  Back: 750,
  Face: 100,
  Shoulder: 750,
  Model: 0,
  Image: 10,
};

export default function UGCUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('Hat');
  const [creatorType, setCreatorType] = useState<'User' | 'Group'>('User');
  const [groupId, setGroupId] = useState('');
  const [status, setStatus] = useState<'idle'|'estimating'|'ready'|'uploading'|'processing'|'success'|'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string| null>(null);
  const [assetId, setAssetId] = useState<number | null>(null);
  const [estimatedFee, setEstimatedFee] = useState<number>(FEE_TABLE[assetType]);
  const [balanceInfo, setBalanceInfo] = useState<{hasEnough:boolean, balance?:number}|null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);
  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.rbxm', '.mesh', '.fbx'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxSize: 200 * 1024 * 1024 // 200MB
  });

  React.useEffect(() => {
    setEstimatedFee(FEE_TABLE[assetType]);
    setBalanceInfo(null);
  }, [assetType]);

  const handleEstimate = async () => {
    setStatus('estimating');
    setError(null);
    try {
      const res = await axios.get('/api/ugc/estimate', {
        params: { assetType, creatorType, groupId }
      });
      setEstimatedFee(res.data.fee);
      setBalanceInfo(res.data.balanceInfo ?? null);
      setStatus('ready');
    } catch (e:any) {
      setError(e?.response?.data?.message || e.message || 'Estimate failed');
      setStatus('error');
    }
  };

  const handleUpload = async () => {
    if (!name) { setError('Please enter an item name'); return; }
    if (files.length === 0) { setError('Please attach at least one file'); return; }

    setStatus('uploading');
    setError(null);
    setProgress(0);

    const fd = new FormData();
    files.forEach((f) => fd.append('file', f));
    fd.append('name', name);
    fd.append('description', description);
    fd.append('type', assetType);
    fd.append('creatorType', creatorType);
    if (creatorType === 'Group' && groupId) fd.append('groupId', groupId);

    try {
      const res = await axios.post('/api/ugc/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (p) => {
          if (p.total) setProgress(Math.round((p.loaded / p.total) * 100));
        }
      });
      setAssetId(res.data.id);
      setStatus('processing');
      // Optionally poll backend for processing status
      setStatus('success');
    } catch (e:any) {
      setStatus('error');
      setError(e?.response?.data?.message || e.message || 'Upload failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <motion.h2 initial={{opacity:0, y:6}} animate={{opacity:1, y:0}} className="text-2xl font-semibold mb-4">
        Upload UGC to Roblox
      </motion.h2>

      <div {...getRootProps()} className={`border-2 border-dashed p-6 rounded mb-4 ${isDragActive ? 'border-blue-400 bg-blue-50' : ''}`}>
        <input {...getInputProps()} />
        <p className="text-sm">Drag & drop .rbxm, .mesh, .fbx or texture files (.png/.jpg) here, or click to browse.</p>
        <ul className="mt-3">
          {files.map((f, i) => <li key={i} className="text-sm text-gray-700">{f.name} — {(f.size/1024/1024).toFixed(2)} MB</li>)}
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Item Name" className="p-2 border rounded"/>
        <select value={assetType} onChange={(e)=>setAssetType(e.target.value as AssetType)} className="p-2 border rounded">
          <option value="Hat">Hat</option>
          <option value="Back">Back</option>
          <option value="Face">Face</option>
          <option value="Shoulder">Shoulder</option>
          <option value="Model">Model</option>
          <option value="Image">Image</option>
        </select>
        <textarea value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Description (optional)" className="p-2 border rounded md:col-span-2"/>
        <div className="flex items-center space-x-2">
          <label className="text-sm">Creator</label>
          <select value={creatorType} onChange={(e)=>setCreatorType(e.target.value as any)} className="p-2 border rounded">
            <option value="User">User</option>
            <option value="Group">Group</option>
          </select>
          {creatorType === 'Group' && (
            <input value={groupId} onChange={(e)=>setGroupId(e.target.value)} placeholder="Group ID" className="p-2 border rounded ml-2"/>
          )}
        </div>
      </div>

      <div className="mb-4 p-4 border rounded bg-gray-50">
        <div className="flex justify-between">
          <div>
            <div className="text-sm text-gray-600">Estimated Upload Fee</div>
            <div className="text-xl font-bold">{estimatedFee} Robux</div>
          </div>
          <div className="text-right">
            <button onClick={handleEstimate} className="px-3 py-2 bg-blue-600 text-white rounded">Estimate & Check Balance</button>
          </div>
        </div>

        {balanceInfo && (
          <div className="mt-2 text-sm">
            Account balance: <span className={balanceInfo.hasEnough ? 'text-green-600' : 'text-red-600'}>{balanceInfo.balance ?? 'Unknown' } Robux</span>
          </div>
        )}
      </div>

      {status === 'uploading' && (
        <div className="mb-4">
          <div className="text-sm">Uploading: {progress}%</div>
          <div className="w-full bg-gray-200 h-2 rounded mt-2">
            <div className="bg-blue-600 h-2 rounded" style={{width:`${progress}%`}}/>
          </div>
        </div>
      )}

      {status === 'success' && assetId && (
        <div className="p-4 mb-4 bg-green-50 border border-green-200 rounded">
          <div className="font-semibold">Upload queued / completed</div>
          <a className="text-blue-600" href={`https://www.roblox.com/catalog/${assetId}`} target="_blank" rel="noreferrer">View on Roblox Marketplace</a>
        </div>
      )}

      {error && <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>}

      <div className="flex space-x-2">
        <button onClick={handleUpload} className="px-4 py-2 bg-green-600 text-white rounded">Upload to Roblox</button>
        <button onClick={()=>{ setFiles([]); setName(''); setDescription(''); setStatus('idle'); setError(null); }} className="px-4 py-2 border rounded">Reset</button>
      </div>
    </div>
  );
}
