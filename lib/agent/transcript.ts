import {getToolName, isTextUIPart, isToolUIPart, type UIMessage} from 'ai'

export interface ToolStep {
  id: string
  name: string
  input: unknown
  output: unknown
  state: 'running' | 'done' | 'failed'
}

/**
 * The answer is the text after the agent's last tool call. Text from earlier
 * steps is the agent narrating its own lookups, which the tool trail already
 * shows.
 */
export function answerText(message: UIMessage): string {
  const lastTool = message.parts.findLastIndex((part) => isToolUIPart(part))
  return message.parts
    .slice(lastTool + 1)
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join('\n\n')
}

export function toolSteps(message: UIMessage): ToolStep[] {
  return message.parts.filter(isToolUIPart).map((part) => ({
    id: part.toolCallId,
    name: getToolName(part),
    input: part.input,
    output: part.state === 'output-available' ? part.output : undefined,
    state:
      part.state === 'output-available'
        ? 'done'
        : part.state === 'output-error' || part.state === 'output-denied'
          ? 'failed'
          : 'running',
  }))
}

/**
 * Every string in what the agent retrieved this turn, for checking its
 * citations against. Tool results arrive in different shapes, Knowledge Base
 * reads as MCP content blocks and the applicability check as plain records, so
 * the strings are collected wherever they sit.
 */
export function retrievedText(message: UIMessage): string {
  return toolSteps(message)
    .filter((step) => step.state === 'done')
    .flatMap((step) => stringsIn(step.output))
    .join('\n')
}

function stringsIn(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (typeof value === 'number') return [String(value)]
  if (Array.isArray(value)) return value.flatMap(stringsIn)
  if (value && typeof value === 'object') return Object.values(value).flatMap(stringsIn)
  return []
}
