import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';
import type { RequestHandler } from './$types';

import { env } from '$env/dynamic/private';

const openai = createOpenAI({
	apiKey: env.OPENAI_API_KEY ?? ''
});

const system = `Ayudas a los fisioterapeutas a planificar sesiones de rehabilitación.`;

export const POST = (async ({ request }) => {
	const { messages } = await request.json();

	const result = await streamText({
		model: openai('gpt-4o-mini'),
		system,
		messages: convertToCoreMessages(messages)
	});

	return result.toDataStreamResponse();
}) satisfies RequestHandler;
