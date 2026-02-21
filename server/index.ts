import 'dotenv/config';
import app from './app';

const port = Number(process.env.PORT) || 3001;

/* =========================
   Start server
========================= */

app.listen(port, () => {
  console.log(`🚀 API running on port ${port}`);
});
