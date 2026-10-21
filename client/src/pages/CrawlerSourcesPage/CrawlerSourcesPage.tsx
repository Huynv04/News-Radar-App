import React from 'react';
import { CrawlerSourcesManagement } from '../../features/crawler';
import './CrawlerSourcesPage.css';

export const CrawlerSourcesPage: React.FC = () => {
    return (
        <div className="crawler-sources-page">
            <CrawlerSourcesManagement />
        </div>
    );
};

export default CrawlerSourcesPage;
