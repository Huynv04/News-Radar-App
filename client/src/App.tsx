import { useState } from 'react';
import { CrawlerSourcesPage } from './pages/CrawlerSourcesPage';
import { NewsFeedPage } from './pages/NewsFeedPage';

export function App() {
  const [tab, setTab] = useState<'feed' | 'sources'>('feed');

  return (
    <div>
      {/* Menu chuyển trang */}
      <nav style={{ padding: '10px', background: '#eee' }}>
        <button onClick={() => setTab('feed')}> Xem Bảng Tin</button>
        <button onClick={() => setTab('sources')}> Quản Lý Nguồn Cào</button>
      </nav>

      {/* Hiển thị trang tương ứng */}
      {tab === 'feed' ? <NewsFeedPage /> : <CrawlerSourcesPage />}
    </div>
  );
}

export default App;