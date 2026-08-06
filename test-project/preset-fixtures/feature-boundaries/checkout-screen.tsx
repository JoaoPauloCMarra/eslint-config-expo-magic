import { getInvoice } from '../../billing/api/client';

export function CheckoutScreen() {
	return <>{getInvoice()}</>;
}
