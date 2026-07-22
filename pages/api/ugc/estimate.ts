import type { NextApiRequest, NextApiResponse } from 'next';

const FEE_TABLE: Record<string, number> = {
  Hat: 750,
  Back: 750,
  Face: 100,
  Shoulder: 750,
  Model: 0,
  Image: 10,
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { assetType = 'Hat', creatorType = 'User', groupId } = req.query;
  const fee = FEE_TABLE[String(assetType)] ?? 0;

  // NOTE: Balance checking requires Roblox API integration (OAuth or a server key with permissions).
  // Here we return a best-effort response with fee and a null balanceInfo. Implement balance checks server-side.

  res.status(200).json({ fee, breakdown: { baseFee: fee }, balanceInfo: null });
}
