import { useState } from 'react';
import { CrawlerSourcesPage } from './pages/CrawlerSourcesPage';
import { NewsFeedPage } from './pages/NewsFeedPage/NewsFeedPage';
import './App.css';

export function App() {
  const [tab, setTab] = useState<'feed' | 'sources'>('feed');

  return (
    <div>
      <header className="top-navbar">
        <h2 className="brand-logo">News Radar</h2>
        <nav className="nav-buttons">
          <button
            className={tab === 'feed' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setTab('feed')}
          >
            Bảng Tin
          </button>
          <button
            className={tab === 'sources' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setTab('sources')}
          >
            Quản Lý Nguồn Cào
          </button>
        </nav>
      </header>

      <main>
        {tab === 'feed' ? <NewsFeedPage /> : <CrawlerSourcesPage />}
      </main>
    </div>
  );
}

export default App;