async function requestJson(url, options = {}) {
	const headers = new Headers(options.headers ?? {});
	if (options.body && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}

	const response = await fetch(url, {
		...options,
		headers,
	});

	const contentType = response.headers.get('content-type') ?? '';
	const payload = contentType.includes('application/json')
		? await response.json()
		: null;

	if (!response.ok) {
		const error = new Error(
			payload?.error ?? `Request failed with status ${response.status}.`
		);
		error.status = response.status;
		error.payload = payload;
		throw error;
	}

	return payload;
}

async function postJson(url, body = {}) {
	return requestJson(url, {
		method: 'POST',
		body: JSON.stringify(body),
	});
}

window.quizApi = {
	postJson,
	requestJson,
};
