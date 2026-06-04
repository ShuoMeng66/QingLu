import { handleVenueEnrich } from '../../lib/venue-enrich-proxy'

export const config = {
  maxDuration: 60,
}

export default function handler(request: Request): Promise<Response> {
  return handleVenueEnrich(request)
}
