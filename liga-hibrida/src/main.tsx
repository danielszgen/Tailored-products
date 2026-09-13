import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { migrateLegacyDayTicks } from './data/days';
import { App } from './app/App';
import './index.css';

registerSW({ immediate: true });

// Schema v2 moved the daily creatina and Combustible ticks out of localStorage. Anything an
// older install left there is folded into the database once, so no tick is lost. Idempotent and
// fire-and-forget: the screens read through Dexie and will re-render when it lands.
void migrateLegacyDayTicks();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
