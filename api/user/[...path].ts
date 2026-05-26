import { backendProxyConfig, proxyToBackend } from '../../lib/proxy-backend-request'

export const config = backendProxyConfig

export default function handler(request: Request): Promise<Response> {
  return proxyToBackend(request, '/api/user')
}
