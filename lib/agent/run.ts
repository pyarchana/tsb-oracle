import {anthropic} from '@ai-sdk/anthropic'
import {convertToModelMessages, isStepCount, streamText, type UIMessage} from 'ai'
import {resolveContextProvider} from '@/lib/context-mcp'
import {buildSystemMessages, type Vehicle} from './systemPrompt'
import {checkApplicability} from './tools/checkApplicability'
import {recordDecision} from './tools/recordDecision'

export const MODEL_ID = 'claude-sonnet-5'

/**
 * streamText stops after a single step by default, which for an agent means it
 * calls its first tool and never answers. Eight covers orienting, checking the
 * vehicle, reading a few entries and replying, with some slack.
 */
const MAX_STEPS = 8

export interface RunAgentInput {
  messages: UIMessage[]
  vehicle?: Vehicle
}

/**
 * Kept out of the route handler so it can be exercised directly, without
 * standing up a server for every check.
 *
 * No temperature is set. Sonnet 5 rejects sampling parameters outright, and the
 * provider strips them with a warning if they appear.
 */
export async function runAgent({messages, vehicle}: RunAgentInput) {
  const context = await resolveContextProvider()
  const tools = {
    ...(await context.tools()),
    check_applicability: checkApplicability,
    record_decision: recordDecision,
  }

  return streamText({
    model: anthropic(MODEL_ID),
    instructions: buildSystemMessages(vehicle),
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: isStepCount(MAX_STEPS),
    maxOutputTokens: 16000,
    providerOptions: {
      anthropic: {
        thinking: {type: 'adaptive'},
        effort: 'high',
      },
    },
    // The live MCP client holds an open connection. The stub has nothing to
    // release, but closing it either way keeps the two paths identical.
    onFinish: () => context.close(),
    onError: () => context.close(),
  })
}
