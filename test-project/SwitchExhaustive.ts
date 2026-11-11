type Phase = 'idle' | 'loading' | 'done';

// ❌ This should trigger switch-exhaustiveness-check: "done" is not handled
export function phaseLabel(phase: Phase): string {
	switch (phase) {
		case 'idle':
			return 'Idle';
		case 'loading':
			return 'Loading';
	}
	return '';
}

// ❌ This should trigger switch-exhaustiveness-check: a bare string needs a default
export function statusLabel(status: string): string {
	switch (status) {
		case 'ok':
			return 'OK';
	}
	return '';
}

// ✅ Every state handled
export function doneLabel(phase: Phase): string {
	switch (phase) {
		case 'idle':
			return 'Idle';
		case 'loading':
			return 'Loading';
		case 'done':
			return 'Done';
	}
}
