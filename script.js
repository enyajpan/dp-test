var w = $(window).width();
var h = $(window).height();

/* initialize firebase */
const firebaseConfig = {
  apiKey: "AIzaSyAidIgPo_dkrLV2FmJGqgGELdEGlV2pXkM",
  authDomain: "risd-dp.firebaseapp.com",
  projectId: "risd-dp",
  storageBucket: "risd-dp.firebasestorage.app",
  messagingSenderId: "640654886959",
  appId: "1:640654886959:web:5be3dd3866004a224e1eda",
  measurementId: "G-JCQFDHPH74"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let unsubscribe = null;
let sortDescending = true; // start with newest first

/* Sorting State */

function makeLinks() {
  const sortDirection = sortDescending ? "desc" : "asc";

  if (unsubscribe) unsubscribe(); // stop previous listener

  unsubscribe = db.collection("entries")
    .orderBy("timestamp", sortDirection)
    .onSnapshot((snapshot) => {
      $("#container .line:not(#th)").remove();

      snapshot.forEach((doc) => {
        const value = doc.data();
        const title = value["subject line"] || "";
        const author = value.author || "";
        const number = value.number || "";
        const message = value.message || "";
        const label = value.label || [];
        const timestamp = value.timestamp?.toDate?.().toLocaleString() || "";

        const newline = $(`
          <div class='line entry-line'>
            <div class="column number">${number}</div>
            <div class="column title"><span class="scramble-paragraph">${title}</span></div>
            <div class="column author"><span class="scramble-paragraph">${author}</span></div>
            <div class="column message">${
              message
                .split('\n')
                .map(p => `<span class="scramble-paragraph">${p}</span>`)
                .join('<br>')
            }</div>
            <div class="column label">
              ${
                Array.isArray(label)
                  ? label.map(l => `<button class="tag-button" data-label="${l}">${l}</button>`).join('')
                  : `<button class="tag-button" data-label="${label}">${label}</button>`
              }
            </div>
            <div class="column timestamp">${timestamp}</div>
          </div>
        `);        

        $("#container").append(newline);
      });

      $(".column.title, .column.author, .column.message").addClass("scramble");
    });
}

$(document).ready(function () {
  makeLinks(); // initial load uses default sortDescending value

  $('#sort-button').on('click', function () {
    sortDescending = !sortDescending;
    const newLabel = sortDescending ? "Sort: Oldest First ↑" : "Sort: Newest First ↓";
    $(this).text(newLabel);
    makeLinks(); // call with new direction
});
  
  
  

  // Live error handling
  const fields = [
    { name: "subject line", errorId: "error-subject" },
    { name: "author", errorId: "error-author" },
    { name: "message", errorId: "error-message", isTextarea: true }
  ];

  fields.forEach(({ name, errorId, isTextarea }) => {
    const field = document.querySelector(`${isTextarea ? "textarea" : "input"}[name="${name}"]`);
    const error = document.getElementById(errorId);
    field.addEventListener("input", () => {
      if (field.value.trim()) error.textContent = "";
    });
  });

  const labelCheckboxes = document.querySelectorAll('input[name="label"]');
  const labelError = document.getElementById("error-label");

  labelCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const anyChecked = Array.from(labelCheckboxes).some(cb => cb.checked);
      if (anyChecked) labelError.textContent = "";
    });
  });

  // Scramble on hover
  // Scramble animation for each paragraph span
$(document).on('mouseenter', '.scramble-paragraph', function () {
  const el = this;

  // Only store once
  if (!el.dataset.originalText) {
    el.dataset.originalText = el.textContent;
  }

  const originalText = el.dataset.originalText;
  const chars = Array.from(new Set(originalText.replace(/\s/g, '').split(''))).join('');
  const duration = 300;
  const steps = 8;
  let frame = 0;

  const scrambleInterval = setInterval(() => {
    let output = '';
    for (let i = 0; i < originalText.length; i++) {
      if (frame > steps) {
        output += originalText[i];
      } else if (Math.random() < frame / steps) {
        output += originalText[i];
      } else {
        output += chars[Math.floor(Math.random() * chars.length)];
      }
    }

    el.textContent = output;
    frame++;

    if (frame > steps) {
      clearInterval(scrambleInterval);
      el.textContent = originalText;
    }
  }, duration / steps);
});


  $(document).on("click", ".tag-button", function () {
    const label = $(this).data("label");
    alert(`You clicked label: ${label}`);
  });

  // Submit
  $("#submission-form").on("submit", async function (e) {
    e.preventDefault();
    clearErrors();

    const subject = $('input[name="subject line"]').val().trim();
    const author = $('input[name="author"]').val().trim();
    const message = $('textarea[name="message"]').val().trim();
    const labels = $('input[name="label"]:checked');

    let hasError = false;
    if (!subject) { showError("error-subject", "Please enter a subject line."); hasError = true; }
    if (!author) { showError("error-author", "What's your name? :D"); hasError = true; }
    if (!message) { showError("error-message", "You must include message to post."); hasError = true; }
    if (labels.length === 0) { showError("error-label", "Please select at least one label."); hasError = true; }

    if (hasError) return;

    try {
      const snapshot = await db.collection("entries").orderBy("timestamp", "desc").get();
      const newNumber = String(snapshot.size + 1).padStart(3, "0");

      const formData = {
        "subject line": subject,
        author: author,
        message: message,
        label: Array.from(labels).map(cb => cb.value),
        number: newNumber,
        timestamp: new Date()
      };

      await db.collection("entries").add(formData);
      this.reset();
    } catch (err) {
      console.error("Error submitting:", err);
    }
  });

  function showError(id, message) {
    $(`#${id}`).text(message).show();
  }

  function clearErrors() {
    $(".error-message").text("").hide();
  }
});
