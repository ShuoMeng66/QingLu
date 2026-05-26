import type { ConnectionStatus } from '../../types/openclaw'

import type { Conversation } from '../../types/conversation'

import type { ClusterTurn } from '../../types/agentCluster'

import { BRAND, SIDEBAR } from '../../copy/ui'

import { QINGLU } from '../../data/qingluAssets'

import { getConnectionStatusLabel } from '../../lib/connectionLabel'

import { ConversationRow } from '../ConversationRow'

import { SquadAvatarStrip } from './SquadAvatarStrip'



interface WorkspaceSidebarProps {

  status: ConnectionStatus

  clusterTurn: ClusterTurn

  activeConversation: Conversation | undefined

  historyConversations: Conversation[]

  activeId: string

  onCreate: () => void

  onSelect: (id: string) => void

  onDelete: (id: string) => void

}



export function WorkspaceSidebar({

  status,

  clusterTurn,

  activeConversation,

  historyConversations,

  activeId,

  onCreate,

  onSelect,

  onDelete,

}: WorkspaceSidebarProps) {

  return (

    <aside className="workspace-sidebar relative z-10 hidden h-full w-[min(100%,var(--sidebar-width))] shrink-0 flex-col gap-3 p-3 md:flex">

      <div className="workspace-sidebar__brand flex items-center justify-between px-3 py-2.5">

        <div className="flex items-center gap-2.5">

          <span className="flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[var(--hairline)] bg-white">

            <img src={QINGLU.avatar} alt="" className="h-full w-full object-cover object-top" />

          </span>

          <div className="min-w-0">

            <strong className="block text-sm font-bold text-ink">{BRAND.name}</strong>

            <span className="block truncate text-[11px] font-medium text-muted">

              {BRAND.tagline}

            </span>

          </div>

        </div>

        <span

          className={`h-2.5 w-2.5 shrink-0 rounded-full ${

            status === 'connected' || status === 'checking'

              ? 'bg-accent-green'

              : status === 'error'

                ? 'bg-red-500'

                : 'bg-gray-300'

          }`}

          title={getConnectionStatusLabel(status)}

        />

      </div>



      <SquadAvatarStrip clusterTurn={clusterTurn} />



      <div className="workspace-sidebar__panel flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2">

        <button type="button" className="sidebar-new-chat pressable w-full" onClick={onCreate}>

          <span className="sidebar-new-chat__icon">+</span>

          {SIDEBAR.newChat}

        </button>



        <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">

          {SIDEBAR.currentSection}

        </p>

        <div className="conversation-list conversation-list--current">

          {activeConversation ? (

            <ConversationRow

              conversation={activeConversation}

              active

              current

              onSelect={onSelect}

              onDelete={onDelete}

            />

          ) : (

            <p className="conversation-empty px-1">{SIDEBAR.noConversation}</p>

          )}

        </div>



        <p className="mt-1 px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">

          {SIDEBAR.historySection}

        </p>

        <div className="conversation-list conversation-list--history min-h-0 flex-1 overflow-y-auto">

          {historyConversations.length === 0 ? (

            <p className="conversation-empty px-1">{SIDEBAR.noHistory}</p>

          ) : (

            historyConversations.map((conversation) => (

              <ConversationRow

                key={conversation.id}

                conversation={conversation}

                active={conversation.id === activeId}

                onSelect={onSelect}

                onDelete={onDelete}

              />

            ))

          )}

        </div>

      </div>

    </aside>

  )

}

