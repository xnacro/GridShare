import dotenv from 'dotenv';
import { createApp } from './src/app.js';
import { store } from './src/state/store.js';

dotenv.config();
const app = createApp();
const PORT = process.env.PORT || 5000;

store.start();

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

export default app;
