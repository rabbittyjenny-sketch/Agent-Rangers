import React from 'react';
import { motion } from 'framer-motion';
import { Container, Card, Button, ClusterBadge } from '../components/design-system';
import { Sparkles, Zap, BarChart3, Users, MessageSquare, ArrowRight } from 'lucide-react';

export const HomePage = ({ onSelectCluster, onStartOnboarding, isLoggedIn }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const clusters = [
    {
      id: 'strategy',
      name: 'Strategy Cluster',
      nameTh: 'วางกลยุทธ์',
      icon: 'BarChart3',
      description: 'วิเคราะห์ตลาด · กำหนดตำแหน่งแบรนด์ · เข้าใจลูกค้า',
      agentCount: 3,
      color: '#FF6B6B',
    },
    {
      id: 'creative',
      name: 'Creative Cluster',
      nameTh: 'สร้างสรรค์',
      icon: 'Sparkles',
      description: 'Visual System · Brand Voice · Brand Story',
      agentCount: 3,
      color: '#FF8FAB',
    },
    {
      id: 'growth',
      name: 'Growth Cluster',
      nameTh: 'ขับเคลื่อนการเติบโต',
      icon: 'Zap',
      description: 'คอนเทนต์ · Campaign · Automation · Analytics',
      agentCount: 4,
      color: '#00CED1',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Container size="lg">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="py-12 sm:py-16 lg:py-20"
        >
          {/* Hero Section */}
          {!isLoggedIn && (
            <motion.section variants={itemVariants} className="mb-16">
              <div className="text-center max-w-3xl mx-auto">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="mb-6 inline-block"
                >
                  <Sparkles className="w-12 h-12 text-[#5E9BEB]" />
                </motion.div>

                <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 font-sarabun">
                  Social Factory
                </h1>

                <p className="text-xl text-gray-600 mb-8 font-sarabun">
                  Create, manage, and optimize your brand's social presence with AI-powered agents
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={onStartOnboarding}
                    className="flex items-center gap-2"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                  <Button variant="secondary" size="lg">
                    Learn More
                  </Button>
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 font-sarabun">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>1000+ Active Brands</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>Real-time Agents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Multi-language Support</span>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* Clusters Section */}
          <motion.section variants={itemVariants} className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 font-sarabun">
              {isLoggedIn ? 'Your Agent Clusters' : 'Explore Agent Clusters'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {clusters.map((cluster) => (
                <motion.div
                  key={cluster.id}
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                >
                  <Card
                    interactive
                    onClick={() => onSelectCluster(cluster.id)}
                    className="h-full cursor-pointer"
                    style={{ borderTop: `4px solid ${cluster.color}` }}
                  >
                    <div className="flex flex-col gap-3">
                      <div style={{ color: cluster.color, fontSize: 28 }}>
                        {cluster.id === 'strategy' ? '📊' : cluster.id === 'creative' ? '🎨' : '🚀'}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 font-sarabun">
                          {cluster.name}
                        </h3>
                        <p className="text-xs font-sarabun" style={{ color: cluster.color }}>
                          {cluster.nameTh}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 font-sarabun">
                        {cluster.description}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-xs text-gray-500">
                        <span>{cluster.agentCount} agents</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Features Section */}
          {!isLoggedIn && (
            <motion.section variants={itemVariants}>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 font-sarabun">
                Powerful Features
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    icon: <Sparkles className="w-6 h-6" />,
                    title: 'AI-Powered Agents',
                    description: 'Intelligent agents that learn your brand voice',
                  },
                  {
                    icon: <BarChart3 className="w-6 h-6" />,
                    title: 'Real-time Analytics',
                    description: 'Track performance across all platforms',
                  },
                  {
                    icon: <Users className="w-6 h-6" />,
                    title: 'Team Collaboration',
                    description: 'Work together seamlessly on brand management',
                  },
                ].map((feature, idx) => (
                  <motion.div key={idx} variants={itemVariants}>
                    <Card>
                      <div className="flex flex-col gap-3">
                        <div className="text-[#5E9BEB]">{feature.icon}</div>
                        <h3 className="font-semibold text-gray-900 font-sarabun">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-gray-600 font-sarabun">
                          {feature.description}
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </motion.div>
      </Container>
    </div>
  );
};

export default HomePage;
