import { useState } from "react";
import Preference_Form from "./Preference_Form";

function App() {
  const [step, setStep] = useState("welcome"); // welcome, email, formSelection, survey
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [selectedForm, setSelectedForm] = useState("");

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
    setStep("formSelection");
  };

  const handleFormSelection = (formType) => {
    setSelectedForm(formType);
    setStep("survey");
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
              placeholder="your.email@graas.ai"
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

  // Form Selection Screen
  if (step === "formSelection") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Select Form</h2>
          <p className="text-gray-600 mb-8">
            Please select which form you would like to fill.
          </p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => handleFormSelection("entire")}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Entire Workflow Response Form
            </button>
            <button
              onClick={() => handleFormSelection("final")}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Final Response Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Survey Screen
  if (step === "survey") {
    return <Preference_Form email={email} formType={selectedForm} />;
  }

  return null;
}

export default App;
