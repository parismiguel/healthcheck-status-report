const express = require("express");
const fs = require("fs");
const app = express();
const port = 3000;

const apiKey = '11053895d41b491f900c9813e8f05115'; // Replace with your secure API key

app.use(express.json());
app.use(express.static("public"));

const reportsFile = "reports.json";

// Custom function to format date
function formatTimestamp(date) {
  const year = date.getFullYear();
  const month = ("0" + (date.getMonth() + 1)).slice(-2);
  const day = ("0" + date.getDate()).slice(-2);

  let hours = date.getHours();
  const minutes = ("0" + date.getMinutes()).slice(-2);
  const seconds = ("0" + date.getSeconds()).slice(-2);

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strHours = ("0" + hours).slice(-2);

  const timeZoneOffset = -date.getTimezoneOffset();
  const offsetHours = ("0" + Math.floor(Math.abs(timeZoneOffset) / 60)).slice(
    -2
  );
  const offsetMinutes = ("0" + (Math.abs(timeZoneOffset) % 60)).slice(-2);
  const timeZoneSign = timeZoneOffset >= 0 ? "+" : "-";
  const timeZone = `GMT${timeZoneSign}${offsetHours}:${offsetMinutes}`;

  return `${year}-${month}-${day} ${strHours}:${minutes}:${seconds} ${ampm} ${timeZone}`;
}

// Middleware for authentication
function authenticate(req, res, next) {
  const providedApiKey = req.headers['x-api-key'];
  if (providedApiKey === apiKey) {
      next();
  } else {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
}

app.post("/report", authenticate, (req, res) => {
  const newReport = req.body;
  let reports = [];

  if (fs.existsSync(reportsFile)) {
    reports = JSON.parse(fs.readFileSync(reportsFile));
  }

  // Check if a report with the same key already exists
  const existingReportIndex = reports.findIndex(
    (report) => report.key === newReport.key
  );

  if (existingReportIndex !== -1) {
    // Overwrite the existing report
    reports[existingReportIndex] = newReport;
  } else {
    // Add the new report
    reports.push(newReport);
  }

  // Sort the reports by name
  reports.sort((a, b) => a.name.localeCompare(b.name));

  fs.writeFileSync(reportsFile, JSON.stringify(reports, null, 2));

  res.json({ status: "success" });
});

app.get("/reports", (req, res) => {
  let reports = [];

  if (fs.existsSync(reportsFile)) {
    reports = JSON.parse(fs.readFileSync(reportsFile));
  }

  // Sort the reports by name before sending
  reports.sort((a, b) => a.name.localeCompare(b.name));

  // Format the timestamp to "yyyy-MM-dd HH:mm:ss zz"
  reports.forEach((report) => {
    const date = new Date(report.timestamp);
    report.timestamp = formatTimestamp(date);
  });

  res.json(reports);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
