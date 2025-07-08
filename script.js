document.addEventListener("DOMContentLoaded", function () {
  const menuBtn = document.getElementById("menuButton");
  const dropdown = document.getElementById("dropdown");
  const invoiceForm = document.getElementById("invoiceForm");
  const downloadBtn = document.getElementById("downloadBtn");
  const pdfBtn = document.getElementById("pdfBtn");
  const card = document.getElementById("output");
  const currencySelect = document.getElementById("currency");

  let currentCurrency = localStorage.getItem("currency") || "INR";
  currencySelect.value = currentCurrency;

  const symbols = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£"
  };

  currencySelect.addEventListener("change", () => {
    currentCurrency = currencySelect.value;
    localStorage.setItem("currency", currentCurrency);
  });

  // Dropdown toggle
  menuBtn.addEventListener("click", () => {
    dropdown.classList.toggle("hidden");
  });

  // Dropdown item actions
  dropdown.querySelectorAll(".dropdown-item").forEach(item => {
    item.addEventListener("click", () => {
      const tab = item.getAttribute("data-tab");
      const action = item.getAttribute("data-action");

      if (tab) {
        document.querySelectorAll(".tab-content").forEach(tabBox => {
          tabBox.classList.remove("active");
          if (tabBox.id === tab) tabBox.classList.add("active");
        });
        if (tab === "view") loadSavedInvoices();
      }

      if (action === "darkmode") {
        document.body.classList.toggle("dark-mode");
        document.querySelectorAll('.container, .topbar, .dropdown, input, button, .invoice-card')
          .forEach(el => el.classList.toggle("dark-mode"));
        document.querySelectorAll('#invoiceList li').forEach(li => li.classList.toggle("dark-mode"));
      }

      if (action === "clear") {
        if (confirm("Are you sure you want to delete all invoices?")) {
          localStorage.removeItem("invoices");
          loadSavedInvoices();
          alert("All invoices cleared!");
        }
      }

      if (action === "export") {
        const invoices = JSON.parse(localStorage.getItem("invoices")) || [];
        if (invoices.length === 0) return alert("No invoices to export.");

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFont("helvetica", "normal");
        doc.setFontSize(14);
        doc.text("Saved Invoices", 15, 20);

        invoices.forEach((inv, i) => {
          const y = 30 + i * 10;
          const currency = symbols[inv.currency || "INR"];
          doc.text(`#${inv.id} | ${inv.client} | ${inv.date} | ${currency}${inv.total}`, 15, y);
          if (y > 270 && i < invoices.length - 1) doc.addPage();
        });

        doc.save("invoices_export.pdf");
      }

      dropdown.classList.add("hidden");
    });
  });

  invoiceForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const client = document.getElementById("client").value;
    const desc = document.getElementById("desc").value;
    const rate = parseFloat(document.getElementById("rate").value);
    const hours = parseFloat(document.getElementById("hours").value);
    const taxRate = parseFloat(document.getElementById("tax").value);

    const base = rate * hours;
    const tax = (base * taxRate) / 100;
    const total = base + tax;
    const today = new Date().toLocaleDateString();
    const invoiceId = Math.floor(Math.random() * 90000) + 10000;

    const symbol = symbols[currentCurrency];

    const output = `
      <h2>Invoice #${invoiceId}</h2>
      <p><strong>Date:</strong> ${today}</p>
      <hr style="border: 0; border-top: 1px solid #ccc;" />
      <p><strong>Client:</strong> ${client}</p>
      <p><strong>Work:</strong> ${desc}</p>
      <p><strong>Hours:</strong> ${hours} @ ${symbol}${rate}/hr</p>
      <p><strong>Subtotal:</strong> ${symbol}${base.toFixed(2)}</p>
      <p><strong>Tax:</strong> ${symbol}${tax.toFixed(2)}</p>
      <p><strong>Total:</strong> ${symbol}${total.toFixed(2)}</p>
      <p style="margin-top: 20px; font-size: 12px;">Made with ❤️ in Freelancer Helper</p>
    `;

    card.innerHTML = output;
    card.classList.remove("hidden");

    // Save invoice
    let invoices = JSON.parse(localStorage.getItem("invoices")) || [];
    invoices.push({
      id: invoiceId,
      date: today,
      client,
      desc,
      rate,
      hours,
      taxRate,
      total: total.toFixed(2),
      currency: currentCurrency
    });
    localStorage.setItem("invoices", JSON.stringify(invoices));

    // PNG download
    downloadBtn.classList.remove("hidden");
    downloadBtn.onclick = () => {
      html2canvas(card).then(canvas => {
        const link = document.createElement("a");
        link.download = `invoice_${invoiceId}.png`;
        link.href = canvas.toDataURL();
        link.click();
      });
    };

    // PDF download
    pdfBtn.classList.remove("hidden");
    pdfBtn.onclick = () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(18);
      doc.text("Invoice", 15, 20);

      let y = 35;
      doc.setFontSize(12);
      doc.text(`Invoice #: ${invoiceId}`, 15, y); y += 8;
      doc.text(`Date: ${today}`, 15, y); y += 8;
      doc.text(`Client: ${client}`, 15, y); y += 8;
      doc.text(`Work: ${desc}`, 15, y); y += 8;
      doc.text(`Hours: ${hours} @ ${symbol}${rate}/hr`, 15, y); y += 8;
      doc.text(`Subtotal: ${symbol}${base.toFixed(2)}`, 15, y); y += 8;
      doc.text(`Tax: ${symbol}${tax.toFixed(2)}`, 15, y); y += 8;
      doc.text(`Total: ${symbol}${total.toFixed(2)}`, 15, y); y += 12;
      doc.setFontSize(10);
      doc.text("Made with ❤️ in Freelancer Helper", 15, y);
      doc.save(`invoice_${invoiceId}.pdf`);
    };
  });

  function loadSavedInvoices() {
    const list = document.getElementById("invoiceList");
    const searchInput = document.getElementById("searchInput");
    let invoices = JSON.parse(localStorage.getItem("invoices")) || [];

    function render(filtered) {
      list.innerHTML = "";
      if (filtered.length === 0) {
        list.innerHTML = "<li>No invoices found.</li>";
        return;
      }

      filtered.forEach((inv, index) => {
        const currency = symbols[inv.currency || "INR"];
        const item = document.createElement("li");
        item.innerHTML = `
          <strong>#${inv.id}</strong> - ${inv.client}<br>
          <span style="font-size:13px;">Date: ${inv.date} | Total: ${currency}${inv.total}</span>
          <br><button class="edit-btn" data-index="${index}">✏️ Edit</button>
        `;
        if (document.body.classList.contains("dark-mode")) {
          item.classList.add("dark-mode");
        }
        list.appendChild(item);
      });

      document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const index = parseInt(btn.getAttribute("data-index"));
          const inv = invoices[index];

          document.getElementById("client").value = inv.client;
          document.getElementById("desc").value = inv.desc;
          document.getElementById("rate").value = inv.rate;
          document.getElementById("hours").value = inv.hours;
          document.getElementById("tax").value = inv.taxRate;

          document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
          document.getElementById("create").classList.add("active");
          dropdown.classList.add("hidden");
        });
      });
    }

    render(invoices);

    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase();
      const filtered = invoices.filter(inv => inv.client.toLowerCase().includes(query));
      render(filtered);
    });
  }
});
