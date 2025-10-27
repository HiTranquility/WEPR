import serverless from 'serverless-http';
// Use dynamic import to keep ESM in Netlify runtime happy
export const handler = async (event, context) => {
  const { default: app } = await import('../../app.js');
  const wrapped = serverless(app);
  return wrapped(event, context);
};


