import { useState } from 'react';
import { CrawlerSourcesPage } from './pages/CrawlerSourcesPage';
import { NewsFeedPage } from './pages/NewsFeedPage/NewsFeedPage';
import { AnalyticsDashboardPage } from './pages/AnalyticsDashboardPage/AnalyticsDashboardPage';
import './App.css';

export function App() {
  const [tab, setTab] = useState<'feed' | 'analytics' | 'sources'>('feed');

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
            className={tab === 'analytics' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setTab('analytics')}
          >
            Phân Tích & NLP
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
        {tab === 'feed' && <NewsFeedPage />}
        {tab === 'analytics' && <AnalyticsDashboardPage />}
        {tab === 'sources' && <CrawlerSourcesPage />}
      </main>
    </div>
  );
}

export default App;