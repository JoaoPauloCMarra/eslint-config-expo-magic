const envKey = 'EXPO_PUBLIC_API_URL';
const dynamicEnv = process.env[envKey];
const { EXPO_PUBLIC_TEST } = process.env;

export const baseOnlyValue = [dynamicEnv, EXPO_PUBLIC_TEST].join(':');
