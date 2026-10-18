import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import { CrawlerSourcesPage } from './pages/CrawlerSourcesPage';
function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100">
      <CrawlerSourcesPage />
    </div>
  );
}

export default App
