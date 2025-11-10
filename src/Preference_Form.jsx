import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import completeBeforeFile from "./assets/Complete_Before_Connect_Feedback_Questions.xlsx?url";
import completeAfterFile from "./assets/Complete_After_Data_Feedback_Questions.xlsx?url";
import beforeFile from "./assets/Before_Connect_Feedback_Questions_And_Responses.xlsx?url";
import afterFile from "./assets/After_data_Feedback_Questions_And_Responses.xlsx?url";

function Preference_Form({ email, formType }) {
  const [allQuestions, setAllQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [isNextLoading, setIsNextLoading] = useState(false);
  const [step, setStep] = useState("survey"); // survey, thankyou

  useEffect(() => {
    loadExcelData();
  }, []);

  const loadExcelData = async () => {
    try {
      // Define file paths based on formType
      let beforeFileUrl, afterFileUrl;

      if (formType === "entire") {
        beforeFileUrl = completeBeforeFile;
        afterFileUrl = completeAfterFile;
      } else {
        beforeFileUrl = beforeFile;
        afterFileUrl = afterFile;
      }

      // Load Before file
      const beforeResponse = await fetch(beforeFileUrl);
      const beforeArrayBuffer = await beforeResponse.arrayBuffer();
      const beforeWorkbook = XLSX.read(beforeArrayBuffer);
      const beforeSheet = beforeWorkbook.Sheets[beforeWorkbook.SheetNames[0]];
      const beforeData = XLSX.utils.sheet_to_json(beforeSheet);

      // Get correct column name based on formType (Complete files have trailing space)
      const claudeColumn =
        formType === "entire"
          ? "Claude-4.5-Haiku Response "
          : "Claude-4.5-Haiku Response";

      const beforeParsed = beforeData.map((row, idx) => ({
        id: `before_${idx}`,
        question: row["Question"],
        models:
          Math.random() > 0.5
            ? {
                A: {
                  name: "Claude-4.5-Haiku",
                  response: row[claudeColumn],
                },
                B: {
                  name: "GPT-4o",
                  response: row["GPT-4o Response"],
                },
              }
            : {
                B: {
                  name: "Claude-4.5-Haiku",
                  response: row[claudeColumn],
                },
                A: {
                  name: "GPT-4o",
                  response: row["GPT-4o Response"],
                },
              },
      }));

      // Load After file
      const afterResponse = await fetch(afterFileUrl);
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
                A: {
                  name: "GPT-5",
                  response: row["GPT-5 Response"],
                },
                B: {
                  name: "Claude-Sonnet-4.5 ",
                  response: row["Claude-Sonnet-4.5 Response"],
                },
              }
            : {
                A: {
                  name: "Claude-Sonnet-4.5 ",
                  response: row["Claude-Sonnet-4.5 Response"],
                },
                B: {
                  name: "GPT-5",
                  response: row["GPT-5 Response"],
                },
              },
      }));

      // Shuffle questions randomly
      const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      // Take 8 random questions from before and 12 from after
      const selectedBefore = shuffleArray(beforeParsed).slice(0, 8);
      const selectedAfter = shuffleArray(afterParsed).slice(0, 12);

      // Mix both together and shuffle again
      const mixed = shuffleArray([...selectedBefore, ...selectedAfter]);
      setAllQuestions(mixed);
    } catch (error) {
      console.error("Error loading Excel files:", error);
    }
  };

  const handlePreference = (preference) => {
    const currentQuestion = allQuestions[currentQuestionIndex];
    const selectedModel = currentQuestion.models[preference].name;
    const selectedResponse = currentQuestion.models[preference].response;
    const sheet = currentQuestion.id.startsWith("before") ? "before" : "after";

    setResponses({
      ...responses,
      [currentQuestion.id]: {
        question: currentQuestion.question,
        preferredModel: selectedModel,
        preferredResponse: selectedResponse,
        preference: preference,
        sheet: sheet,
      },
    });
  };

  const handleNext = async () => {
    setIsNextLoading(true);
    const currentQuestion = allQuestions[currentQuestionIndex];
    const currentResponse = responses[currentQuestion.id];

    // Submit current response to Google Sheets
    try {
      const googleSheetsUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL;

      if (
        googleSheetsUrl &&
        googleSheetsUrl !== "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE"
      ) {
        await fetch(googleSheetsUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            formType: formType,
            responses: [currentResponse],
          }),
          mode: "no-cors",
        });
      }
    } catch (error) {
      console.error("Error submitting response:", error);
    }

    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setStep("thankyou");
    }
    setIsNextLoading(false);
  };

  const getTotalQuestions = () => {
    return allQuestions.length;
  };

  const getCompletedQuestions = () => {
    return currentQuestionIndex;
  };

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
  if (allQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600">Loading questions...</div>
      </div>
    );
  }

  const currentQuestion = allQuestions[currentQuestionIndex];
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
        <div className="bg-white rounded-lg shadow-lg p-3 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!hasResponse || isNextLoading}
            className="px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {isNextLoading
              ? "Saving..."
              : currentQuestionIndex === allQuestions.length - 1
              ? "Continue"
              : "Submit & Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Preference_Form;
