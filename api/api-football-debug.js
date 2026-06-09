export default async function handler(req, res) {
  try {
    const apiKey = process.env.API_FOOTBALL_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Missing API_FOOTBALL_KEY environment variable",
      });
    }

    const base = "https://v3.football.api-sports.io";

    const call = async (path) => {
      const response = await fetch(`${base}${path}`, {
        headers: { "x-apisports-key": apiKey },
      });

      const data = await response.json();

      return {
        path,
        ok: response.ok,
        status: response.status,
        errors: data.errors,
        results: data.results,
        paging: data.paging,
        sample: Array.isArray(data.response) ? data.response.slice(0, 5) : data.response,
      };
    };

    const checks = await Promise.all([
      call("/status"),
      call("/leagues?search=world cup"),
      call("/leagues?id=1"),
      call("/fixtures/rounds?league=1&season=2026"),
      call("/fixtures?league=1&season=2026"),
      call("/fixtures?league=1&season=2025"),
      call("/fixtures?league=1&season=2022"),
    ]);

    return res.status(200).json({
      source: "api-football-debug",
      fetchedAt: new Date().toISOString(),
      checks,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: error.message,
    });
  }
}
