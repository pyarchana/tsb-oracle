import {createUIMessageStreamResponse, toUIMessageStream, type UIMessage} from 'ai'
import {runAgent} from '@/lib/agent/run'
import type {Vehicle} from '@/lib/agent/systemPrompt'

export async function POST(request: Request) {
  const {messages, vehicle}: {messages: UIMessage[]; vehicle?: Vehicle} = await request.json()

  const result = await runAgent({messages, vehicle})

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({stream: result.stream}),
  })
}
