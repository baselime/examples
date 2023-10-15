
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { BaselimeSDK } = await import('@baselime/node-opentelemetry');

    const sdk = new BaselimeSDK({
      serverless: true
    });
    sdk.start();
  }
}