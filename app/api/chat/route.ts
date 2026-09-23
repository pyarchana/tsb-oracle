import {createUIMessageStreamResponse, toUIMessageStream, type UIMessage} from 'ai'
import {runAgent} from '@/lib/agent/run'
import type {Vehicle} from '@/lib/agent/systemPrompt'

/**
 * An answer takes several steps: the outline, a few Knowledge Base reads, the
 * applicability check, then the writing. Around a minute is normal and a
 * hosting default measured in seconds would cut every answer short.
 */
export const maxDuration = 300

export async function POST(request: Request) {
  const {messages, vehicle}: {messages: UIMessage[]; vehicle?: Vehicle} = await request.json()

  const result = await runAgent({messages, vehicle})

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({stream: result.stream}),
  })
}
