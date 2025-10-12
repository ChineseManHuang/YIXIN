import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/app.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Express app expects (req, res) and handles the response
  app(req, res);
}
