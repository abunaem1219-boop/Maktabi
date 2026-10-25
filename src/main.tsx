import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Fontsource font imports (Offline font bundling)
import '@fontsource/noto-sans-bengali/400.css';
import '@fontsource/noto-sans-bengali/700.css';
import '@fontsource/noto-serif-bengali/400.css';
import '@fontsource/noto-serif-bengali/700.css';
import '@fontsource/hind-siliguri/400.css';
import '@fontsource/hind-siliguri/600.css';
import '@fontsource/amiri/400.css';
import '@fontsource/amiri/700.css';
import '@fontsource/cairo/400.css';
import '@fontsource/cairo/700.css';
import '@fontsource/merriweather/400.css';
import '@fontsource/lora/400.css';
import '@fontsource/fira-code/400.css';

createRoot(document.getElementById('root')!).render(<App />);
