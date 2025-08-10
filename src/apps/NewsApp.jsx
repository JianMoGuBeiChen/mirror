import React, { useState, useEffect } from 'react';
import { getAppSettings } from '../data/apps';
import { useTheme } from '../context/ThemeContext';

const NewsApp = ({ appId = 'news' }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(getAppSettings(appId));
  const { theme } = useTheme();

  useEffect(() => {
    setSettings(getAppSettings(appId));
  }, [appId]);

  // Live update when settings change elsewhere
  useEffect(() => {
    const handleStorage = () => setSettings(getAppSettings(appId));
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [appId]);

  useEffect(() => {
    fetchNews();
    
    // Set up refresh interval
    const interval = setInterval(fetchNews, settings.refreshInterval || 300000);
    return () => clearInterval(interval);
  }, [settings.source, settings.maxItems, settings.refreshInterval]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchNews = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Using a free news API - you might want to replace this with your preferred news service
      // For demo purposes, we'll simulate news data since most news APIs require API keys
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      
      const mockNews = [
        {
          id: 1,
          title: "Technology Advances in AI Continue to Shape Industries",
          summary: "Artificial intelligence developments are transforming various sectors...",
          publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 min ago
        },
        {
          id: 2,
          title: "Global Climate Summit Reaches New Agreements",
          summary: "World leaders agree on new climate initiatives and targets...",
          publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        },
        {
          id: 3,
          title: "Space Exploration Milestone Achieved",
          summary: "New discoveries in space exploration mark significant progress...",
          publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() // 4 hours ago
        },
        {
          id: 4,
          title: "Economic Markets Show Positive Trends",
          summary: "Financial analysts report encouraging market indicators...",
          publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() // 6 hours ago
        },
        {
          id: 5,
          title: "Healthcare Innovation Breakthrough Announced",
          summary: "Medical researchers unveil new treatment methodologies...",
          publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() // 8 hours ago
        }
      ];
      
      setNews(mockNews.slice(0, settings.maxItems || 5));
    } catch (err) {
      console.error('News fetch error:', err);
      setError('Unable to fetch news');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (loading && news.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-white/70">Loading news...</div>
      </div>
    );
  }

  if (error && news.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-center text-red-400">
          <div className="text-lg mb-2">📰</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col p-4">
      <div className="flex items-center mb-3">
        <div className="font-semibold text-lg" style={{ color: 'white' }}>
          <span role="img" aria-label="news" className="mr-1" style={{ color: theme.accent }}>📰</span>
          News
        </div>
        {loading && (
          <div className="ml-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Updating...</div>
        )}
      </div>
      
      <div className="flex-1 overflow-auto space-y-3">
        {news.map((article) => (
          <div key={article.id} className="pb-2 last:border-b-0 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="text-sm font-medium leading-tight mb-1" style={{ color: 'white' }}>
              {article.title}
            </div>
            <div className="text-xs leading-relaxed mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {article.summary}
            </div>
            <div className="text-xs" style={{ color: theme.accent }}>
              {formatTimeAgo(article.publishedAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsApp;
