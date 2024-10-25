<script lang="ts">
	import { useChat } from '@ai-sdk/svelte';
	import PlusIcon from 'lucide-svelte/icons/plus';
	import SvelteMarkdown from 'svelte-markdown';
	import { onMount, afterUpdate } from 'svelte';
	import { writable } from 'svelte/store';
	import { ArrowUp, Loader, User, BotMessageSquare } from 'lucide-svelte';
	import { spring } from 'svelte/motion';

	let textInput: HTMLInputElement | null = null;
	let messagesContainer: HTMLDivElement | null = null;
	let waitMessage = writable(false);
	let avatarScale = spring(1);
	let avatarVisible = true;

	function cleanHistory() {
		$messages = [];
	}

	let selectedModel = 'mistral'; // Modelo por defecto
	let api = `/api/chat/${selectedModel}`;
	const { input, handleSubmit: chatHandleSubmit, messages, isLoading, stop } = useChat({
		api,
		keepLastMessageOnError: true,
		onResponse: (response: Response) => {
			console.log('onResponse', response);
		},
		onFinish() {
			waitMessage.set(false);
		},
		onError: (error: Error) => {
			console.log('onError', error);
			waitMessage.set(false);
		}
	});

	function handleSubmit() {
		chatHandleSubmit();
	}

	function toggleModel() {
		selectedModel = selectedModel === 'mistral' ? 'codegpt' : 'mistral';
		api = `/api/chat/${selectedModel}`;
		// Aquí podrías reiniciar o actualizar la instancia de useChat si es necesario
	}

	onMount(() => {
		textInput = document.querySelector('input');
		messagesContainer = document.getElementById('messagesContainer') as HTMLDivElement | null;
		if (textInput) {
			textInput.focus();
		}
	});

	afterUpdate(() => {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	});

	function handleInputChange() {
		avatarScale.set(1.1);
		setTimeout(() => avatarScale.set(1), 200);
	}

	// Genera un número aleatorio para el avatar
	const avatarSeed = Math.floor(Math.random() * 1000);

	function speakText(text: string) {
		if ('speechSynthesis' in window) {
			const utterance = new SpeechSynthesisUtterance(text);
			window.speechSynthesis.speak(utterance);
		} else {
			console.log('Text-to-speech no es compatible con este navegador.');
		}
	}
</script>

<svelte:head>
	<title>Hackathon LLM</title>
	<meta name="description" content="Mistral and CodeGPT Chatbot Demo" />
</svelte:head>

<main class="flex h-screen">
	<!-- Sidebar -->
	<aside class="w-64 bg-gray-100 dark:bg-gray-800 flex flex-col justify-between h-full">
		<div class="p-4">
			<!-- Modelo Switch -->
			<label for="model-switch" class="block mb-2 text-gray-800 dark:text-gray-200">Modelo: {selectedModel}</label>
			<label class="switch">
				<input type="checkbox" on:change={toggleModel} checked={selectedModel === 'codegpt'}>
				<span class="slider round"></span>
			</label>
		</div>
		<div class="p-4">
			<!-- Video -->
			{#if $isLoading}
				<video
					src="/esp_hablando2.mp4"
					autoplay
					loop
					muted
					class="w-full h-auto max-h-96 object-cover rounded-lg shadow-lg"
					style="aspect-ratio: 9 / 16;"
				></video>
			{/if}
		</div>
	</aside>

	<div class="flex-1 flex flex-col">
		<!-- Navbar -->
		<header class="flex items-center justify-between p-4 bg-white dark:bg-gray-900 shadow">
			<h1 class="text-lg font-semibold text-white dark:text-white">LLM Hackathon</h1>
			<button
				on:click={() => cleanHistory()}
				type="button"
				class="text-sm px-2 py-1.5 rounded-lg border flex gap-2 items-center bg-white dark:bg-slate-900 text-white"
				disabled={!$messages.length || $isLoading}
			>
				<PlusIcon class="size-4" />
				New Chat
			</button>
		</header>

		<!-- MESSAGES -->
		<section
			id="messagesContainer"
			class="flex flex-col gap-4 px-4 pb-4 h-full overflow-y-auto pt-4"
		>
			<div class="flex flex-col mx-auto max-w-2xl w-full h-full">
				{#if $messages.length > 0}
					<ul class="flex flex-col gap-2 w-full">
						{#each $messages as message}
							<li class="fade-in-from-bottom p-2 rounded flex gap-2">
								<div
									class={`size-7 flex items-center justify-center text-sm rounded-full uppercase font-semibold flex-shrink-0 ${message.role !== 'user' ? 'bg-purple-100 text-purple-500' : 'bg-slate-100 text-slate-500'}`}
								>
									{#if message.role !== 'user'}
										<BotMessageSquare class="size-4" />
									{:else}
										<User class="size-4" />
									{/if}
								</div>
								<div class="flex flex-col gap-2 pt-1.5">
									<b class="text-xs tracking-tight capitalize">{message.role}</b>
									<div class="prose prose-base prose-slate flex flex-col">
										<SvelteMarkdown source={message.content} />
									</div>
								</div>
							</li>
						{/each}
						{#if $waitMessage}
							<div class="p-2 rounded flex gap-4 items-center fade-in-from-bottom">
								<div class="px-1 flex gap-2 items-center justify-center">
									<Loader class="text-slate-400 animate-spin size-5" />
									<p class="text-slate-700 tracking-tight">Thinking.</p>
								</div>
							</div>
						{/if}
					</ul>
				{:else}
					<p class="max-w-xs text-center m-auto p-4 rounded-xl bg-slate-50">
						Type something and press enter
					</p>
				{/if}
			</div>
		</section>

		<!-- Chat Input -->
		<form on:submit={handleSubmit} class="flex gap-2 w-full mt-auto mx-auto max-w-2xl p-4">
			<input
				bind:value={$input}
				class="border rounded-xl w-full bg-slate-50 px-3 py-2 h-12"
				placeholder="Type something and press enter"
				on:input={handleInputChange}
				on:keydown={(e: KeyboardEvent) => {
					if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault();
						handleSubmit();
						waitMessage.set(true);
					}
				}}
			/>
			{#if !$isLoading}
				<button
					type="submit"
					class="rounded-xl bg-black text-white dark:bg-white dark:text-black flex gap-2 items-center justify-center size-12"
					on:click={() => {
						waitMessage.set(true);
					}}
				>
					<ArrowUp class="size-5" />
				</button>
			{:else}
				<button
					on:click={() => {
						stop();
						waitMessage.set(false);
					}}
					type="submit"
					class="px-2 py-1.5 rounded-xl bg-red-400 text-red-50"
				>
					Stop
				</button>
			{/if}
		</form>
	</div>
</main>

<style>
	.switch {
		position: relative;
		display: inline-block;
		width: 60px;
		height: 34px;
	}

	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #ccc;
		transition: .4s;
	}

	.slider:before {
		position: absolute;
		content: "";
		height: 26px;
		width: 26px;
		left: 4px;
		bottom: 4px;
		background-color: white;
		transition: .4s;
	}

	input:checked + .slider {
		background-color: #2196F3;
	}

	input:checked + .slider:before {
		transform: translateX(26px);
	}

	.slider.round {
		border-radius: 34px;
	}

	.slider.round:before {
		border-radius: 50%;
	}
</style>

