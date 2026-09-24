module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const neighborhood = String(body.neighborhood || "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "Valid email required" });
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + process.env.RESEND_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "FogTap Waitlist <onboarding@resend.dev>",
          to: ["sideszac89@gmail.com"],
          subject: "FogTap waitlist signup",
          html:
            "<h2>New FogTap waitlist signup</h2>" +
            "<table>" +
            "<tr><td>Name</td><td>" + escapeHtml(name) + "</td></tr>" +
            "<tr><td>Email</td><td>" + escapeHtml(email) + "</td></tr>" +
            "<tr><td>Phone</td><td>" + escapeHtml(phone) + "</td></tr>" +
            "<tr><td>Neighborhood</td><td>" + escapeHtml(neighborhood) + "</td></tr>" +
            "</table>"
        })
      });
      const data = await r.json().catch(function () { return {}; });
      if (r.ok) return res.status(200).json({ ok: true, via: "resend", data: data });
    } catch (err) {}
  }

  if (process.env.FORMSPREE_FORM_ID) {
    try {
      const r = await fetch("https://formspree.io/f/" + process.env.FORMSPREE_FORM_ID, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: name, email: email, phone: phone, neighborhood: neighborhood })
      });
      if (r.ok) return res.status(200).json({ ok: true, via: "formspree" });
    } catch (err) {}
  }

  try {
    const r = await fetch("https://formsubmit.co/ajax/sideszac89@gmail.com", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: name,
        email: email,
        phone: phone,
        neighborhood: neighborhood,
        _subject: "FogTap waitlist signup",
        _template: "table",
        _captcha: "false"
      })
    });
    const data = await r.json().catch(function () { return {}; });
    return res.status(200).json({
      ok: true,
      via: "formsubmit",
      formsubmit: data,
      note: "If first submission, confirm FormSubmit activation email at sideszac89@gmail.com"
    });
  } catch (err) {
    return res.status(502).json({ ok: false, error: "Upstream email failed", detail: String(err && err.message || err) });
  }
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};
