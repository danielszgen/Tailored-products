import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import TailoredProductsPreview from './TailoredProductsPreview';
import WebsiteReviewDashboard from './WebsiteReviewDashboard';
import './index.css';

function App() {
	const [route, setRoute] = useState(window.location.hash);

	useEffect(() => {
		const onHash = () => setRoute(window.location.hash);
		window.addEventListener('hashchange', onHash);
		return () => window.removeEventListener('hashchange', onHash);
	}, []);

	if (route === '#/dashboard') return <WebsiteReviewDashboard />;
	return <TailoredProductsPreview />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
