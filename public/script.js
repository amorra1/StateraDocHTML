document.addEventListener("DOMContentLoaded", () => {
  const organizationList = document.getElementById("organizations");
  const search = document.getElementById("searchUser");
  const organizations = ["Organization1", "Organization2", "Organization3"];

  const docList = document.getElementById("docList");
  const searchVC = document.getElementById("vcSearch");
  const versionTitle = document.getElementById("versionsTitle");

  const versionSelected = document.getElementById("versionSelected");
  const pdfViewer = document.getElementById("pdfViewer");

  const usernameInput = document.getElementById("usernameInput");

  // Event listener for the button
  search.addEventListener("click", () => {
    // Clear the dropdown menu initially
    organizationList.innerHTML =
      "<option disabled selected>Select an option</option>";

    // Populate the dropdown menu with new options
    organizations.forEach((option) => {
      const optionItem = document.createElement("option");
      optionItem.textContent = option;
      optionItem.value = option; // Add value for better functionality
      organizationList.appendChild(optionItem);
    });
  });

  searchVC.addEventListener("click", async () => {
    // const docs = ["v1", "v2", "v3"];
    const username = usernameInput.value;
    // fetch
    console.log(username);

    const response = await fetch(
      `http://localhost:4000/fileVersions?username=${username}`
    );

    if (!response.ok) {
      console.log(error);
    }

    const files = await response.json();

    versionTitle.textContent = "Version History";

    files.forEach((file) => {
      const docVersion = document.createElement("button");
      const timestamp = formatDate(file.timestamp);

      docVersion.textContent = timestamp;
      docVersion.dataset.timestamp = timestamp;
      docVersion.dataset.filename = file.filename; // store the filename as data
      docVersion.dataset.id = file.documentID;
      docList.appendChild(docVersion);

      //add event listener to each document
      docVersion.addEventListener("click", async () => {
        versionSelected.textContent = docVersion.dataset.timestamp;

        const id = docVersion.dataset.id;

        // const response = await fetch(
        //   `http://localhost:4000/getVersion?filename=${filename}`
        // );

        // if (!response.ok) {
        //   console.log(error);
        // }
        // const pdfBlob = await response.blob();
        // const pdfUrl = URL.createObjectURL(pdfBlob);
        // pdfViewer.src = pdfUrl;
        pdfViewer.src = `http://localhost:4000/getVersion?id=${id}`;
      });
    });
  });
});

function formatDate(dateStr) {
  const date = new Date(dateStr);

  // Extracting the individual components of the date
  const month = date.getMonth() + 1; // Months are 0-indexed, so we add 1
  const day = date.getDate();
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0"); // Pad minutes with leading zero if needed
  const ampm = hours >= 12 ? "PM" : "AM"; // Determine AM or PM

  // Convert 24-hour time to 12-hour time
  hours = hours % 12; // Convert hour from 24-hour to 12-hour format
  hours = hours ? hours : 12; // If hours is 0, set it to 12

  // Return the formatted date
  return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
}
