/** Node serverless proxy — more reliable than Edge fetch to DashScope/DeepSeek */

import { handleOpenClawProxy } from '../../lib/openclaw-proxy'

export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
}

export default function handler(request: Request): Promise<Response> {
  return handleOpenClawProxy(request)
}
