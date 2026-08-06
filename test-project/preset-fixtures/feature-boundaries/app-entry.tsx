import { track } from '../services/analytics/track';

export function AppEntry() {
	return <>{track('app-entry')}</>;
}
