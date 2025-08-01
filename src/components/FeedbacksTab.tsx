import React, { useState, useEffect } from 'react';
import { feedbackAPI, busAPI, userAPI } from '../utils/api';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';
import { StarRating } from './StarRating';
import { Star, MessageSquare, TrendingUp, Filter, Search, Calendar } from 'lucide-react';
import { Feedback, FeedbackStats, Bus, User } from '../types';

// Extended interface for API response that might include Supabase user_metadata
interface ApiUser extends User {
  user_metadata?: {
    username?: string;
    role?: 'client' | 'admin' | 'employee';
  };
}

export const FeedbacksTab: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'stats' | 'by-bus' | 'by-user'>('all');
  const [selectedBusId, setSelectedBusId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchFeedbacks();
  }, [activeTab, selectedBusId, selectedUserId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch buses and users for filters
      const [busesResponse, usersResponse] = await Promise.all([
        busAPI.getBuses(),
        userAPI.getUsers()
      ]);
      setBuses(busesResponse.data);
      setUsers(usersResponse.data);
    } catch (err) {
      setError('Failed to fetch initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      let response;

      switch (activeTab) {
        case 'stats':
          // Fetch stats separately with its own loading state
          setStatsLoading(true);
          try {
            const statsResponse = await feedbackAPI.getFeedbackStats();
            setStats(statsResponse.data || {
              total_feedbacks: 0,
              average_rating: 0,
              rating_distribution: {},
              bus_feedback_count: []
            });
          } catch (statsErr) {
            console.error('Failed to fetch stats:', statsErr);
            setStats({
              total_feedbacks: 0,
              average_rating: 0,
              rating_distribution: {},
              bus_feedback_count: []
            });
          } finally {
            setStatsLoading(false);
          }
          // Also get all feedbacks for the stats view
          response = await feedbackAPI.getFeedbacks();
          break;
        case 'by-bus':
          if (selectedBusId) {
            response = await feedbackAPI.getFeedbacksByBus(selectedBusId);
          } else {
            response = await feedbackAPI.getFeedbacks();
          }
          break;
        case 'by-user':
          if (selectedUserId) {
            response = await feedbackAPI.getFeedbacksByUser(selectedUserId);
          } else {
            response = await feedbackAPI.getFeedbacks();
          }
          break;
        default:
          response = await feedbackAPI.getFeedbacks();
          break;
      }

      if (response) {
        setFeedbacks(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch feedbacks:', err);
      setError(`Failed to fetch feedbacks`);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      feedback.comment?.toLowerCase().includes(searchLower) ||
      feedback.user?.username?.toLowerCase().includes(searchLower) ||
      feedback.user?.email?.toLowerCase().includes(searchLower) ||
      feedback.bus?.bus_number?.toLowerCase().includes(searchLower) ||
      feedback.bus?.route_name?.toLowerCase().includes(searchLower)
    );
  });

  if (loading && feedbacks.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Feedback Management</h2>
        <button
          onClick={fetchFeedbacks}
          className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Refresh
        </button>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-3 px-6 font-medium text-sm ${
            activeTab === 'all'
              ? 'border-b-2 border-pink-500 text-pink-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Feedbacks
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`py-3 px-6 font-medium text-sm ${
            activeTab === 'stats'
              ? 'border-b-2 border-pink-500 text-pink-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Statistics
        </button>
        <button
          onClick={() => setActiveTab('by-bus')}
          className={`py-3 px-6 font-medium text-sm ${
            activeTab === 'by-bus'
              ? 'border-b-2 border-pink-500 text-pink-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          By Bus
        </button>
        <button
          onClick={() => setActiveTab('by-user')}
          className={`py-3 px-6 font-medium text-sm ${
            activeTab === 'by-user'
              ? 'border-b-2 border-pink-500 text-pink-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          By User
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search feedbacks, users, or bus numbers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent w-full"
          />
        </div>

        {/* Bus Filter */}
        {activeTab === 'by-bus' && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedBusId}
              onChange={(e) => setSelectedBusId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">All Buses</option>
              {buses.map((bus) => (
                <option key={bus.id} value={bus.id}>
                  {bus.bus_number}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* User Filter */}
        {activeTab === 'by-user' && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username || user.user_metadata?.username || user.email}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Statistics View */}
      {activeTab === 'stats' && (
        <>
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Feedbacks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_feedbacks || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.average_rating ? stats.average_rating.toFixed(1) : '0.0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rating Distribution</p>
                <div className="flex gap-1 mt-2">
                  {[5, 4, 3, 2, 1].map(rating => (
                    <div key={rating} className="text-xs">
                      <div className="text-center">{rating}★</div>
                      <div className="text-center font-bold">
                        {stats.rating_distribution?.[rating.toString()] || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Top Rated Bus</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.bus_feedback_count && stats.bus_feedback_count.length > 0
                    ? stats.bus_feedback_count[0]?.bus_number || 'N/A'
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No statistics available</p>
            </div>
          )}
        </>
      )}

      {/* Feedbacks List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {activeTab === 'stats' ? 'Recent Feedbacks' :
             activeTab === 'by-bus' ? `Bus Feedbacks ${selectedBusId ? `(${buses.find(b => b.id === selectedBusId)?.bus_number})` : ''}` :
             activeTab === 'by-user' ? `User Feedbacks ${selectedUserId ? `(${users.find(u => u.id === selectedUserId)?.username || users.find(u => u.id === selectedUserId)?.email})` : ''}` :
             'All Feedbacks'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredFeedbacks.length} feedback{filteredFeedbacks.length !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredFeedbacks.map((feedback) => (
            <div key={feedback.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <StarRating rating={feedback.rating} showNumber={true} />
                    <div className="text-sm text-gray-500">
                      {formatDate(feedback.created_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                    <span className="font-medium">
                      User: {feedback.user?.username || feedback.user?.email || 'Unknown User'}
                    </span>
                    <span>•</span>
                    <span className="font-medium">
                      Bus: {feedback.bus?.bus_number || 'Unknown Bus'}
                    </span>
                    {feedback.bus?.route_name && (
                      <>
                        <span>•</span>
                        <span>Route: {feedback.bus.route_name}</span>
                      </>
                    )}
                  </div>

                  {feedback.comment && (
                    <div className="bg-gray-50 rounded-lg p-3 mt-3">
                      <p className="text-gray-700 text-sm leading-relaxed">
                        "{feedback.comment}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredFeedbacks.length === 0 && !loading && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'No feedbacks match your search.' : 'No feedbacks found.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
