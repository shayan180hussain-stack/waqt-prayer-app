// Vercel serverless function — runs on Vercel's servers, not in the browser,
// so it isn't subject to the CORS restriction that blocked the direct and
// proxy attempts. Deploy this file at /api/mawaqit.js in a Vercel project
// and it becomes available at https://your-app.vercel.app/api/mawaqit?slug=...

export default async function handler(req, res) {
  const { slug } = req.query;
  if (!slug) {
    res.status(400).json({ error: "Missing slug parameter" });
    return;
  }

  try {
    const targetUrl = `https://mawaqit.net/en/${slug}`;
    const response = await fetch(targetUrl);
    if (!response.ok) {
      res.status(502).json({ error: `Mawaqit returned ${response.status}` });
      return;
    }
    const html = await response.text();
    const match = html.match(/var\s+confData\s*=\s*(\{[\s\S]*?\});/);
    if (!match) {
      res.status(502).json({ error: "Couldn't find prayer time data on the page" });
      return;
    }
    const conf = JSON.parse(match[1]);

    const order = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    const adhanArr = conf.times || [];
    const today = new Date();
    const iqamaArr =
      conf.iqamaCalendar?.[today.getMonth()]?.[today.getDate() - 1] || conf.iqama || [];

    const adhan = {};
    const iqama = {};
    order.forEach((p, i) => {
      if (adhanArr[i]) adhan[p] = adhanArr[i];
      if (Array.isArray(iqamaArr) && iqamaArr[i]) iqama[p] = iqamaArr[i];
    });

    if (Object.keys(adhan).length === 0) {
      res.status(502).json({ error: "Page format not recognized" });
      return;
    }

    // Cache for 5 minutes at the edge so repeated app opens don't hammer Mawaqit.
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    res.status(200).json({ name: conf.name || slug, adhan, iqama });
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error fetching Mawaqit data" });
  }
}
