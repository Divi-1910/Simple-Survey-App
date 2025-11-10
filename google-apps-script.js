// Google Apps Script - Deploy as Web App
// This script receives data from frontend and writes to Google Sheet

function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    const email = data.email;
    const formType = data.formType;
    const responses = data.responses;

    // Get the appropriate sheet based on formType
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName =
      formType === "entire"
        ? "Entire Workflow Compare & Preferences Sheet"
        : "Final Response Compare & Preferences Sheet";
    let sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }

    // If sheet is empty, add headers
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Email",
        "Question",
        "Preferred Response",
        "Model Used",
        "workflow_state",
      ]);
    }

    const timestamp = new Date();
    responses.forEach((response) => {
      let workflow_state;
      if (response.sheet == "after") {
        workflow_state = "after_data";
      } else if (response.sheet == "before") {
        workflow_state = "before_data";
      } else {
        workflow_state = "null";
      }

      sheet.appendRow([
        timestamp,
        email,
        response.question,
        response.preferredResponse,
        response.preferredModel,
        workflow_state,
      ]);
    });

    // Return success response
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: "Data saved successfully" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle OPTIONS request for CORS
function doOptions(e) {
  return ContentService.createTextOutput("").setMimeType(
    ContentService.MimeType.JSON
  );
}
