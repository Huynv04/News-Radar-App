import React, { useState } from 'react';
import { useAuth } from '../../../../providers/AuthProvider';
import { bookmarkApi } from '../../../../features/bookmarks';
import './BookmarkButton.css';

interface BookmarkButtonProps {
    articleId: string;
    initialBookmarked?: boolean;
}

export function BookmarkButton({ articleId, initialBookmarked = false }: BookmarkButtonProps) {
    const { isAuthenticated } = useAuth();
    const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            window.location.href = '/auth';
            return;
        }

        setIsLoading(true);
        try {
            if (isBookmarked) {
                await bookmarkApi.remove(articleId);
                setIsBookmarked(false);
            } else {
                await bookmarkApi.add({ articleId });
                setIsBookmarked(true);
            }
        } catch (err) {
            console.error('Bookmark toggle error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            id={`bookmark-btn-${articleId}`}
            className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
            onClick={handleToggle}
            disabled={isLoading}
            title={isBookmarked ? 'Bỏ lưu' : 'Lưu bài viết'}
            aria-label={isBookmarked ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
        >
            {isLoading
                ? <span className="bookmark-spinner" />
                : <span className="bookmark-icon">{isBookmarked ? '🔖' : '🔖'}</span>
            }
        </button>
    );
}
