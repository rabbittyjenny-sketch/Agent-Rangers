import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Container, Button, AgentCard, ClusterBadge, Card, Badge } from '../components/design-system';
import { ArrowLeft, Search, Filter } from 'lucide-react';

export const Dashboard = ({ clusterId, onBack, onSelectAgent, masterContext }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Mock agent data
  const mockAgents = [
    {
      id: 1,
      name: 'Social Strategist',
      type: 'Strategy',
      description: 'Plans and optimizes content strategy across channels',
      capabilities: ['Planning', 'Analytics', 'Optimization'],
      conversations: 24,
      efficiency: 92,
    },
    {
      id: 2,
      name: 'Content Creator',
      type: 'Creative',
      description: 'Generates engaging social media content',
      capabilities: ['Writing', 'Image Generation', 'Video Scripts'],
      conversations: 18,
      efficiency: 88,
    },
    {
      id: 3,
      name: 'Community Manager',
      type: 'Engagement',
      description: 'Manages community interactions and engagement',
      capabilities: ['Response', 'Moderation', 'Engagement'],
      conversations: 42,
      efficiency: 95,
    },
    {
      id: 4,
      name: 'Analytics Bot',
      type: 'Analytics',
      description: 'Analyzes metrics and provides insights',
      capabilities: ['Analysis', 'Reporting', 'Forecasting'],
      conversations: 15,
      efficiency: 85,
    },
    {
      id: 5,
      name: 'Trend Scout',
      type: 'Research',
      description: 'Discovers trending topics and opportunities',
      capabilities: ['Trend Detection', 'Research', 'Opportunity ID'],
      conversations: 12,
      efficiency: 78,
    },
    {
      id: 6,
      name: 'SEO Optimizer',
      type: 'Technical',
      description: 'Optimizes content for search visibility',
      capabilities: ['SEO', 'Keyword Research', 'Optimization'],
      conversations: 9,
      efficiency: 82,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const clusterInfo = {
    'data': { name: 'Data Intelligence', color: 'from-blue-500 to-blue-600' },
    'network': { name: 'Social Network', color: 'from-purple-500 to-purple-600' },
    'analytics': { name: 'Performance Analytics', color: 'from-green-500 to-green-600' },
    'automation': { name: 'Content Automation', color: 'from-orange-500 to-orange-600' },
  };

  const cluster = clusterInfo[clusterId] || { name: 'Agents', color: 'from-gray-500 to-gray-600' };

  const filteredAgents = mockAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || agent.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-8">
      <Container size="lg">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[#5E9BEB] hover:text-[#4A7BC9] font-semibold mb-4 font-sarabun"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>

            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cluster.color}`} />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 font-sarabun">
                  {cluster.name}
                </h1>
                <p className="text-gray-600 font-sarabun">
                  {filteredAgents.length} agents available
                </p>
              </div>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <motion.div variants={itemVariants} className="mb-8 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-gray-300 focus:border-[#5E9BEB] focus:outline-none transition-colors font-sarabun"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {['all', 'Strategy', 'Creative', 'Engagement', 'Analytics'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type === 'all' ? 'all' : type)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all font-sarabun ${
                    filterType === (type === 'all' ? 'all' : type)
                      ? 'bg-[#5E9BEB] text-white'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Agents Grid */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredAgents.map((agent) => (
              <motion.div
                key={agent.id}
                variants={itemVariants}
                onClick={() => onSelectAgent(agent.id)}
              >
                <AgentCard agent={agent} onClick={() => onSelectAgent(agent.id)} />
              </motion.div>
            ))}
          </motion.div>

          {filteredAgents.length === 0 && (
            <motion.div variants={itemVariants} className="text-center py-12">
              <Card>
                <p className="text-gray-600 font-sarabun text-lg">
                  No agents found matching your search
                </p>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </Container>
    </div>
  );
};

export default Dashboard;
