import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getQuestions, submitAssessment } from '../api/assessment';

const Assessment = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await getQuestions(5);
      if (response.success) {
        setQuestions(response.data.questions || []);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast.error('Please answer all questions');
      return;
    }

    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer
      }));

      const response = await submitAssessment(formattedAnswers);
      if (response.success) {
        setResult(response.data);
        toast.success('Assessment submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setAnswers({});
    fetchQuestions();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="loader" />
      </div>
    );
  }

  if (result) {
    const getLevelColor = () => {
      switch (result.level) {
        case 'advanced':
          return 'text-green-600';
        case 'intermediate':
          return 'text-yellow-600';
        default:
          return 'text-blue-600';
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Assessment Complete!
            </h1>
            <div className="mb-6">
              <p className="text-5xl font-bold text-primary-500 mb-2">
                {result.score}%
              </p>
              <p className={`text-xl font-semibold ${getLevelColor()}`}>
                Level: {result.level.charAt(0).toUpperCase() + result.level.slice(1)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Results Breakdown</h3>
              <div className="space-y-2 text-left">
                {result.results.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                    <span className="text-gray-700">Question {index + 1}</span>
                    <span className={item.correct ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {item.correct ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
            >
              Take Assessment Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chinese Language Assessment
          </h1>
          <p className="text-gray-600">
            Test your knowledge and discover your proficiency level
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-gray-500">
              Progress: {Object.keys(answers).length}/{questions.length}
            </span>
            <div className="w-64 bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-8">
            {questions.map((question, index) => (
              <div key={question.id} className="border-b border-gray-200 pb-6 last:border-0">
                <div className="flex items-start gap-3 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </span>
                  <div>
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded mb-2 capitalize">
                      {question.type}
                    </span>
                    <h3 className="text-lg font-medium text-gray-900">
                      {question.question}
                    </h3>
                  </div>
                </div>

                {question.options && (
                  <div className="ml-11 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {JSON.parse(question.options).map((option, optionIndex) => (
                      <button
                        key={optionIndex}
                        onClick={() => handleAnswer(question.id, option)}
                        className={`p-4 text-left rounded-lg border-2 transition-colors ${
                          answers[question.id] === option
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="loader" />
                Submitting...
              </>
            ) : (
              'Submit Assessment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Assessment;
