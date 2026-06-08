import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const nativeUi = require('./native-ui.js');

export default nativeUi;
export const createNativeUiConfig = nativeUi.createNativeUiConfig;
export const defaultRestrictions = nativeUi.defaultRestrictions;
export const recommended = nativeUi.recommended;
