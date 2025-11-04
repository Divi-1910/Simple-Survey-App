import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import beforeFile from "./assets/Before_Connect_Feedback_Questions_And_Responses.xlsx?url";
import afterFile from "./assets/After_data_Feedback_Questions_And_Responses.xlsx?url";

function App() {
  const [step, setStep] = useState("welcome"); // welcome, email, survey, acknowledgment, survey2, confirmation, thankyou
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [beforeQuestions, setBeforeQuestions] = useState([]);
  const [afterQuestions, setAfterQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [currentSheet, setCurrentSheet] = useState("before"); // before or after
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadExcelData();
  }, []);

  const loadExcelData = async () => {
    try {
      // Load Before file
      const beforeResponse = await fetch(beforeFile);
      const beforeArrayBuffer = await beforeResponse.arrayBuffer();
      const beforeWorkbook = XLSX.read(beforeArrayBuffer);
      const beforeSheet = beforeWorkbook.Sheets[beforeWorkbook.SheetNames[0]];
      const beforeData = XLSX.utils.sheet_to_json(beforeSheet);

      const beforeParsed = beforeData.map((row, idx) => ({
        id: `before_${idx}`,
        question: row["Question"],
        models:
          Math.random() > 0.5
            ? {
                A: {
                  name: "Claude-4.5-Haiku",
                  response: row["Claude-4.5-Haiku Response"],
                },
                B: { name: "GPT-4o", response: row["GPT-4o Response"] },
              }
            : {
                A: { name: "GPT-4o", response: row["GPT-4o Response"] },
                B: {
                  name: "Claude-4.5-Haiku",
                  response: row["Claude-4.5-Haiku Response"],
                },
              },
      }));

      // Load After file
      const afterResponse = await fetch(afterFile);
      const afterArrayBuffer = await afterResponse.arrayBuffer();
      const afterWorkbook = XLSX.read(afterArrayBuffer);
      const afterSheet = afterWorkbook.Sheets[afterWorkbook.SheetNames[0]];
      const afterData = XLSX.utils.sheet_to_json(afterSheet);

      const afterParsed = afterData.map((row, idx) => ({
        id: `after_${idx}`,
        question: row["Question"],
        models:
          Math.random() > 0.5
            ? {
                A: { name: "GPT-5", response: row["GPT-5 Response"] },
                B: {
                  name: "Claude-Sonnet-4.5",
                  response: row["Claude-Sonnet-4.5 Response"],
                },
              }
            : {
                A: {
                  name: "Claude-Sonnet-4.5",
                  response: row["Claude-Sonnet-4.5 Response"],
                },
                B: { name: "GPT-5", response: row["GPT-5 Response"] },
              },
      }));

      setBeforeQuestions(beforeParsed);
      setAfterQuestions(afterParsed);
    } catch (error) {
      console.error("Error loading Excel files:", error);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    if (!email.endsWith("graas.ai"))
      return "You are not part of our organization , Get out of here";
    return "";
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }
    setEmailError("");
    setStep("survey");
  };

  const handlePreference = (preference) => {
    const questions =
      currentSheet === "before" ? beforeQuestions : afterQuestions;
    const currentQuestion = questions[currentQuestionIndex];
    const selectedModel = currentQuestion.models[preference].name;
    const selectedResponse = currentQuestion.models[preference].response;

    setResponses({
      ...responses,
      [currentQuestion.id]: {
        question: currentQuestion.question,
        sheet: currentSheet,
        preferredModel: selectedModel,
        preferredResponse: selectedResponse,
        preference: preference,
      },
    });
  };

  const handleNext = () => {
    const questions =
      currentSheet === "before" ? beforeQuestions : afterQuestions;

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      if (currentSheet === "before") {
        setStep("acknowledgment");
      } else {
        setStep("confirmation");
      }
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleAcknowledgmentNext = () => {
    setCurrentSheet("after");
    setCurrentQuestionIndex(0);
    setStep("survey");
  };

  const getCurrentQuestions = () => {
    return currentSheet === "before" ? beforeQuestions : afterQuestions;
  };

  const getTotalQuestions = () => {
    return beforeQuestions.length + afterQuestions.length;
  };

  const getCompletedQuestions = () => {
    return currentSheet === "before"
      ? currentQuestionIndex
      : beforeQuestions.length + currentQuestionIndex;
  };

  // Welcome Screen
  if (step === "welcome") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome!</h1>
          <p className="text-gray-600 mb-8">
            Thank you for participating in our feedback survey. Your insights
            will help us improve our AI models.
          </p>
          <button
            onClick={() => setStep("email")}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Start Survey
          </button>
        </div>
      </div>
    );
  }

  // Email Form
  if (step === "email") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Enter Your Email
          </h2>
          <form onSubmit={handleEmailSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@xyz.ai"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-2">{emailError}</p>
            )}
            <button
              type="submit"
              className="w-full mt-6 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Acknowledgment Screen
  if (step === "acknowledgment") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Great Progress!
          </h2>
          <p className="text-gray-600 mb-8">
            You've completed the first set of questions. Let's continue with the
            next set.
          </p>
          <button
            onClick={handleAcknowledgmentNext}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const googleSheetsUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL;
      
      if (!googleSheetsUrl || googleSheetsUrl === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
        alert('Google Sheets URL not configured. Please set VITE_GOOGLE_SHEETS_URL in .env file');
        setIsSubmitting(false);
        return;
      }
      
      const payload = {
        email: email,
        responses: Object.values(responses)
      };
      
      const response = await fetch(googleSheetsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });
      
      setStep('thankyou');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Confirmation Screen
  if (step === "confirmation") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Submit Feedback?
          </h2>
          <p className="text-gray-600 mb-8">
            Are you sure you want to submit your feedback? You won't be able to
            make changes after submission.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setStep("survey")}
              disabled={isSubmitting}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Go Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Thank You Screen
  if (step === "thankyou") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Thank You!</h2>
          <p className="text-gray-600 mb-4">
            Your feedback has been recorded. We appreciate your time and
            valuable input.
          </p>
          <p className="text-sm text-gray-500">
            You can now close this window.
          </p>
        </div>
      </div>
    );
  }

  // Survey Screen
  const questions = getCurrentQuestions();
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600">Loading questions...</div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const hasResponse = responses[currentQuestion.id];
  const selectedPreference = hasResponse?.preference;

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col p-4 overflow-hidden">
      {/* Progress Bar */}
      <div className="flex-shrink-0 mb-3">
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              Question {getCompletedQuestions() + 1} of {getTotalQuestions()}
            </span>
            <span>
              {Math.round(
                ((getCompletedQuestions() + 1) / getTotalQuestions()) * 100
              )}
              % Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{
                width: `${
                  ((getCompletedQuestions() + 1) / getTotalQuestions()) * 100
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-shrink-0 mb-3">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-bold text-gray-800">
            {currentQuestion.question}
          </h2>
        </div>
      </div>

      {/* Responses */}
      <div className="grid md:grid-cols-2 gap-4 mb-3 flex-1 min-h-0">
        {/* Model A */}
        <div
          className={`bg-white rounded-lg shadow-lg p-4 flex flex-col min-h-0 ${
            selectedPreference === "A" ? "ring-4 ring-indigo-500" : ""
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex-shrink-0">
            Model A Response
          </h3>
          <div className="prose prose-sm max-w-none text-gray-700 overflow-y-auto flex-1 mb-3 min-h-0">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {currentQuestion.models.A.response}
            </ReactMarkdown>
          </div>
          <button
            onClick={() => handlePreference("A")}
            className={`w-full py-2 rounded-lg font-semibold transition flex-shrink-0 ${
              selectedPreference === "A"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {selectedPreference === "A"
              ? "✓ Selected"
              : "I prefer this response"}
          </button>
        </div>

        {/* Model B */}
        <div
          className={`bg-white rounded-lg shadow-lg p-4 flex flex-col min-h-0 ${
            selectedPreference === "B" ? "ring-4 ring-indigo-500" : ""
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex-shrink-0">
            Model B Response
          </h3>
          <div className="prose prose-sm max-w-none text-gray-700 overflow-y-auto flex-1 mb-3 min-h-0">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {currentQuestion.models.B.response}
            </ReactMarkdown>
          </div>
          <button
            onClick={() => handlePreference("B")}
            className={`w-full py-2 rounded-lg font-semibold transition flex-shrink-0 ${
              selectedPreference === "B"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {selectedPreference === "B"
              ? "✓ Selected"
              : "I prefer this response"}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-shrink-0">
        <div className="bg-white rounded-lg shadow-lg p-3 flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentQuestionIndex === 0 && currentSheet === "before"}
            className="px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!hasResponse}
            className="px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {currentQuestionIndex === questions.length - 1
              ? "Continue"
              : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
