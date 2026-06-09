export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const apiKey = process.env.API_FOOTBALL_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Missing API_FOOTBALL_KEY environment variable",
      });
    }

    const url = "https://v3.football.api-sports.io/fixtures?league=1&season=2026";

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-apisports-key": apiKey,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "API-Football request failed",
        details: data,
      });
    }

    return res.status(200).json({
      source: "api-football",
      league: 1,
      season: 2026,
      fetchedAt: new Date().toISOString(),
      results: data.results,
      fixtures: data.response,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: error.message,
    });
  }
}
