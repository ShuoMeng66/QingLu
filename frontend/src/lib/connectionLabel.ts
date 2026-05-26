import type { ConnectionStatus } from '../types/openclaw'
import { CONNECTION_STATUS_LABEL } from '../copy/ui'

export function getConnectionStatusLabel(status: ConnectionStatus): string {
  return CONNECTION_STATUS_LABEL[status]
}
