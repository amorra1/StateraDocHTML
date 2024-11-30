const express = require("express");
const sql = require("mssql");
const app = express();
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const PORT = 4000;
require("dotenv").config();

// Database configuration
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true, // Use this if you're connecting to Azure
    trustServerCertificate: true, // Allow self-signed certificates (useful in local development)
  },
};

// Connect to the database
sql.connect(config, (err) => {
  if (err) {
    console.error("Database connection error:", err);
    return;
  }
  console.log("Connected to the database");
});

// Serve static files
app.use(express.static("public"));

// API endpoint to get data

app.get("/fileVersions", async (req, res) => {
  const username = req.query.username;
  if (!username) {
    console.log("No username provided");
  } else {
    console.log(username);
  }

  const request = new sql.Request();

  const insertQuery = `SELECT Filename, Timestamp, DocumentID FROM DocumentUploads WHERE Username = @username`;

  request.input("username", sql.VarChar, username);

  const result = await request.query(insertQuery);

  if (result.recordset.length > 0) {
    const files = result.recordset.map((record) => ({
      filename: record.Filename,
      timestamp: record.Timestamp,
      documentID: record.DocumentID,
    }));
    // const filenames = result.recordset.map((record) => record.Filename);
    console.log("files", files);
    return res.json(files); //return filenames as json response
  } else {
    return res.status(404).send("No files found for the specified user");
  }
});

// app.get("/getVersion", async (req, res) => {
//   const id = req.query.id;
//   if (!id) {
//     console.log("No filename provided");
//   } else {
//     console.log(filename);
//   }

//   const request = new sql.Request();

//   const insertQuery = `SELECT FileData from DocumentUploads WHERE DocumentID = @id`;

//   request.input("id", sql.INT, id);

//   const result = await request.query(insertQuery);

//   if (result.recordset.length > 0) {
//     const fileData = result.recordset[0].FileData;
//     // const filenames = result.recordset.map((record) => record.Filename);
//     const tempFilePath = path.join(__dirname, `${filename}.docx`);
//     fs.writeFileSync(tempFilePath, fileData);

//     // Convert the Word document to PDF using LibreOffice (headless mode)
//     const pdfFilePath = path.join(__dirname, `${filename}.pdf`);

//     exec(
//       `libreoffice --headless --convert-to pdf ${tempFilePath} --outdir ${__dirname}`,
//       (err, stdout, stderr) => {
//         if (err) {
//           console.error("Error converting Word to PDF:", stderr);
//           return res.status(500).send("Error converting document to PDF");
//         }

//         console.log("Conversion successful:", stdout);

//         // Send the generated PDF as the response
//         res.setHeader("Content-Type", "application/pdf");
//         res.setHeader(
//           "Content-Disposition",
//           `inline; filename=${filename}.pdf`
//         );
//         fs.createReadStream(pdfFilePath).pipe(res); // send back in this stream

//         // Clean up temporary files after serving the PDF
//         fs.unlinkSync(tempFilePath);
//         fs.unlinkSync(pdfFilePath);
//       }
//     );

// console.log("files", files);
// res.setHeader(
//   "Content-Type",
//   "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
// );
// res.setHeader(
//   "Content-Disposition",
//   `attachment; filename=${filename}.docx`
// );

// // Send the file data as the response
// res.send(fileData);
//   } else {
//     return res.status(404).send("No files found for the specified user");
//   }
// });

// app.get("/getVersion", (req, res) => {
//   const id = req.query.id; // Retrieve 'id' from the URL parameter
//   console.log("Received request to download document with ID:", id);

//   // Define the SQL query to retrieve the file
//   const insertQuery = `SELECT Filename, FileData from DocumentUploads WHERE DocumentID = @id`;

//   const request = new sql.Request();
//   request.input("id", sql.INT, id); // Pass 'id' as a parameter in the SQL query

//   // Execute the query to fetch the file from the database
//   request.query(insertQuery, (err, result) => {
//     if (err) {
//       console.log("Error fetching file from database");
//       return res.status(400).send("Error fetching file from database");
//     }

//     // Check if a document was found
//     if (result.recordset.length > 0) {
//       const fileData = result.recordset[0].FileData; // Retrieve file data
//       const filename = result.recordset[0].Filename; // Retrieve the filename

//       // Set appropriate headers for downloading the file
//       res.setHeader(
//         "Content-Type",
//         "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
//       );
//       res.setHeader(
//         "Content-Disposition",
//         `attachment; filename=${filename}.docx`
//       );

//       // Send the file data as the response
//       res.send(fileData);
//     } else {
//       console.log("Document not found");
//       return res.status(404).send("Document not found");
//     }
//   });
// });

app.get("/getVersion", (req, res) => {
  const id = req.query.id; // Retrieve 'id' from the URL parameter
  console.log("Received request to download document with ID:", id);

  // Define the SQL query to retrieve the file
  const insertQuery = `SELECT Filename, FileData from DocumentUploads WHERE DocumentID = @id`;

  const request = new sql.Request();
  request.input("id", sql.INT, id); // Pass 'id' as a parameter in the SQL query

  // Execute the query to fetch the file from the database
  request.query(insertQuery, (err, result) => {
    if (err) {
      console.log("Error fetching file from database");
      return res.status(400).send("Error fetching file from database");
    }

    // Check if a document was found
    if (result.recordset.length > 0) {
      const fileData = result.recordset[0].FileData; // Retrieve file data
      const filename = result.recordset[0].Filename; // Retrieve the filename

      // Create a temporary file to store the Word document
      const tempFilePath = path.join(__dirname, "temp", `${filename}.docx`);

      // Write the binary data to the temporary Word file
      fs.writeFile(tempFilePath, fileData, (writeErr) => {
        if (writeErr) {
          console.log("Error writing file", writeErr);
          return res.status(500).send("Error saving document temporarily");
        }

        // Use LibreOffice to convert the Word document to PDF
        const outputDir = path.join(__dirname, "temp");
        const outputFilePath = path.join(outputDir, `${filename}.pdf`);

        const command = `libreoffice --headless --convert-to pdf "${tempFilePath}" --outdir "${outputDir}"`;

        // Execute the LibreOffice command to convert the document
        exec(command, (convertErr, stdout, stderr) => {
          if (convertErr) {
            console.error(`Error converting Word to PDF: ${convertErr}`);
            return res.status(500).send("Error converting Word to PDF");
          }

          // Check if the PDF file is created
          fs.readFile(outputFilePath, (readErr, pdfData) => {
            if (readErr) {
              console.log("Error reading converted PDF", readErr);
              return res.status(500).send("Error reading converted PDF");
            }

            // Set the correct headers for the PDF response
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
              "Content-Disposition",
              `inline; filename=${filename}.pdf`
            );

            // Send the PDF data back to the client
            res.send(pdfData);

            // Clean up: delete the temporary files
            fs.unlink(tempFilePath, (unlinkErr) => {
              if (unlinkErr) {
                console.error("Error deleting temporary Word file", unlinkErr);
              }
            });
            fs.unlink(outputFilePath, (unlinkErr) => {
              if (unlinkErr) {
                console.error("Error deleting temporary PDF file", unlinkErr);
              }
            });
          });
        });
      });
    } else {
      console.log("Document not found");
      return res.status(404).send("Document not found");
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
