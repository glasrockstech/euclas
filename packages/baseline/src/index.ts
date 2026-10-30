import { context, stateAt } from './files.ts';
import type { State } from './types.ts';

export async function inspect(input: unknown, configuration: unknown): Promise<State | null> {
  const { request, environment } = await context(input, configuration);
  return stateAt(request, environment);
}
