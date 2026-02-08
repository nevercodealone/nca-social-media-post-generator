export function getEnvVariable(variable: string, defaultValue?: string): string {
  const value = process.env[variable];
  if (value) return value;
  if (defaultValue !== undefined) return defaultValue;
  console.error(`Missing required environment variable: ${variable}`);
  throw new Error(`Environment variable ${variable} is not set`);
}
