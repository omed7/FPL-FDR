import axios from 'axios';

// Fallback proxy if allorigins is failing due to cloudflare on premier league api side
// We will use a reliable proxy approach
const PROXY_URL = 'https://corsproxy.io/?url=';
const TEAMS_URL = 'https://fantasy.premierleague.com/api/bootstrap-static/';
const FIXTURES_URL = 'https://fantasy.premierleague.com/api/fixtures/';

export const fetchFPLData = async () => {
  try {
    const [teamsRes, fixturesRes] = await Promise.all([
      axios.get(`${PROXY_URL}${encodeURIComponent(TEAMS_URL)}`),
      axios.get(`${PROXY_URL}${encodeURIComponent(FIXTURES_URL)}`)
    ]);

    const bootstrapData = teamsRes.data;
    const fixturesData = fixturesRes.data;

    const teams = bootstrapData.teams.map((team) => ({
      id: team.id,
      name: team.name,
      short_name: team.short_name,
      code: team.code,
      logoUrl: `https://resources.premierleague.com/premierleague/badges/50/t${team.code}.png`,
    }));

    const events = bootstrapData.events;

    // Group fixtures by event
    const fixturesByEvent = {};
    fixturesData.forEach(fixture => {
      if (!fixture.event) return;
      if (!fixturesByEvent[fixture.event]) {
        fixturesByEvent[fixture.event] = [];
      }
      fixturesByEvent[fixture.event].push(fixture);
    });

    // Filter events (gameweeks) to exclude past ones where all matches are finished
    const upcomingEvents = events.filter(event => {
      const eventFixtures = fixturesByEvent[event.id] || [];
      if (eventFixtures.length === 0) return true; // Keep if no fixtures known yet just in case
      const allFinished = eventFixtures.every(f => f.finished);
      return !allFinished;
    });

    return {
      teams,
      events: upcomingEvents,
      fixturesData
    };
  } catch (error) {
    console.error("Error fetching FPL data:", error);
    throw error;
  }
};
