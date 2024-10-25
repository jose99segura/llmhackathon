import { createMistral } from '@ai-sdk/mistral';
import { streamText, convertToCoreMessages } from 'ai';
import type { RequestHandler } from './$types';

import { env } from '$env/dynamic/private';

const mistral = createMistral({
	apiKey: env.MISTRAL_API_KEY ?? ''
});

const system = `Ayudas a los fisioterapeutas a planificar sesiones de rehabilitación.`;

export const POST = (async ({ request }) => {
	const { messages } = await request.json();

	const result = await streamText({
		model: mistral('ministral-8b-2410'),
		system,
		messages: convertToCoreMessages(messages)
	});

	return result.toDataStreamResponse();
}) satisfies RequestHandler;
