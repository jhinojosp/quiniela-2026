const OPENFOOTBALL_URLS = [
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json",
  "https://raw.githubusercontent.com/openfootball/worldcup.json/main/2026/worldcup.json",
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/worldcup/2026/worldcup.json",
  "https://raw.githubusercontent.com/openfootball/worldcup.json/main/worldcup/2026/worldcup.json"
];

async function tryFetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "quiniela-2026-vercel-function"
    }
  });

  const text = await response.text();

  if (!response.ok) {
    return {
      ok: false,
      url,
      status: response.status,
      contentType: response.headers.get("content-type"),
      preview: text.slice(0, 200)
    };
  }

  try {
    return {
      ok: true,
      url,
      status: response.status,
      data: JSON.parse(text)
    };
  } catch (error) {
    return {
      ok: false,
      url,
      status: response.status,
      contentType: response.headers.get("content-type"),
      preview: text.slice(0, 200),
      error: "Response was not valid JSON"
    };
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const attempts = [];

    for (const url of OPENFOOTBALL_URLS) {
      const result = await tryFetchJson(url);
      attempts.push({
        ok: result.ok,
        url: result.url,
        status: result.status,
        contentType: result.contentType,
        preview: result.preview,
        error: result.error
      });

      if (result.ok) {
        return res.status(200).json({
          source: "openfootball/worldcup.json",
          fetchedAt: new Date().toISOString(),
          url: result.url,
          data: result.data
        });
      }
    }

    return res.status(404).json({
      error: "Could not find a valid OpenFootball 2026 JSON file",
      attempts
    });
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: error.message
    });
  }
}
