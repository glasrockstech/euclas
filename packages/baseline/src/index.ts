import { context, stateAt } from './files.ts';

export async function inspect(input: unknown, configuration: unknown) {
  const { request, environment } = await context(input, configuration);
  return stateAt(request, environment);
}
