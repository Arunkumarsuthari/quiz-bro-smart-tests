
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, Trophy, Calendar, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Quiz {
  id: string;
  title: string;
  description: string;
  duration: number;
  is_published: boolean;
  scheduled_for: string | null;
  created_at: string;
}

interface Response {
  id: string;
  quiz_id: string;
  total_marks: number;
  submitted_at: string;
  quiz: {
    title: string;
    duration: number;
  };
}

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [completedQuizzes, setCompletedQuizzes] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch available quizzes
      const { data: quizzes, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (quizzesError) throw quizzesError;

      // Fetch completed quizzes
      const { data: responses, error: responsesError } = await supabase
        .from('responses')
        .select(`
          *,
          quiz:quizzes(title, duration)
        `)
        .eq('user_id', user?.id)
        .order('submitted_at', { ascending: false });

      if (responsesError) throw responsesError;

      // Filter out quizzes that have already been attempted
      const attemptedQuizIds = new Set(responses?.map(r => r.quiz_id) || []);
      const filteredQuizzes = quizzes?.filter(quiz => !attemptedQuizIds.has(quiz.id)) || [];

      setAvailableQuizzes(filteredQuizzes);
      setCompletedQuizzes(responses || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const isQuizAvailable = (quiz: Quiz) => {
    if (!quiz.scheduled_for) return true;
    return new Date(quiz.scheduled_for) <= new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Quiz Bro - Student</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.email}</span>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available Quizzes</p>
                  <p className="text-2xl font-bold text-gray-900">{availableQuizzes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{completedQuizzes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {completedQuizzes.length > 0 
                      ? Math.round(completedQuizzes.reduce((acc, quiz) => acc + quiz.total_marks, 0) / completedQuizzes.length)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Quizzes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Quizzes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableQuizzes.map((quiz) => {
              const available = isQuizAvailable(quiz);
              return (
                <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      <Badge variant={available ? "default" : "secondary"}>
                        {available ? "Available" : "Scheduled"}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {quiz.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{quiz.duration} minutes</span>
                      </div>
                      {quiz.scheduled_for && (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>
                            {available ? 'Available now' : `Available from ${new Date(quiz.scheduled_for).toLocaleString()}`}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full" 
                      disabled={!available}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {available ? 'Start Quiz' : 'Not Available Yet'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {availableQuizzes.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No available quizzes</h3>
              <p className="mt-1 text-sm text-gray-500">Check back later for new quizzes from your teachers.</p>
            </div>
          )}
        </div>

        {/* Completed Quizzes */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Results</h2>
          <div className="space-y-4">
            {completedQuizzes.slice(0, 5).map((response) => (
              <Card key={response.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900">{response.quiz.title}</h3>
                      <p className="text-sm text-gray-600">
                        Completed on {new Date(response.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600">{response.total_marks}%</div>
                      <Button variant="outline" size="sm">View Details</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {completedQuizzes.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No completed quizzes yet</h3>
              <p className="mt-1 text-sm text-gray-500">Start taking quizzes to see your results here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
