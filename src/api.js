import axios from 'axios';

/**
 * Base URLs for the official FPL API. Requests go through a CORS proxy because
 * the API doesn't set CORS headers for browsers. `VITE_FPL_PROXY` lets users
 * point at their own cache/Worker (see `server/fpl-worker.js`).
 */
const DEFAULT_PROXY = 'https://corsproxy.io/?url=';
const PROXY_URL = import.meta.env?.VITE_FPL_PROXY || DEFAULT_PROXY;

const BASE = 'https://fantasy.premierleague.com/api';
const BOOTSTRAP_URL = `${BASE}/bootstrap-static/`;
const FIXTURES_URL = `${BASE}/fixtures/`;

/** @param {string} url */
function proxied(url) {
  // Accept both `?url=` (corsproxy.io) and direct prefix proxies.
  if (PROXY_URL.endsWith('=')) return `${PROXY_URL}${encodeURIComponent(url)}`;
  return `${PROXY_URL}${url}`;
}

/**
 * @param {any} team
 * @returns {import('./types.js').Team}
 */
function mapTeam(team) {
  return {
    id: team.id,
    name: team.name,
    short_name: team.short_name,
    code: team.code,
    strength: team.strength,
    strength_overall_home: team.strength_overall_home,
    strength_overall_away: team.strength_overall_away,
    strength_attack_home: team.strength_attack_home,
    strength_attack_away: team.strength_attack_away,
    strength_defence_home: team.strength_defence_home,
    strength_defence_away: team.strength_defence_away,
    logoUrl: `https://resources.premierleague.com/premierleague/badges/50/t${team.code}.png`,
  };
}

export const fetchFPLData = async () => {
  const [teamsRes, fixturesRes] = await Promise.all([
    axios.get(proxied(BOOTSTRAP_URL)),
    axios.get(proxied(FIXTURES_URL)),
  ]);

  const bootstrapData = teamsRes.data;
  const fixturesData = fixturesRes.data;

  const teams = bootstrapData.teams.map(mapTeam);
  const events = bootstrapData.events;
  const elements = bootstrapData.elements || [];
  const elementTypes = bootstrapData.element_types || [];

  const fixturesByEvent = {};
  for (const fixture of fixturesData) {
    if (!fixture.event) continue;
    if (!fixturesByEvent[fixture.event]) fixturesByEvent[fixture.event] = [];
    fixturesByEvent[fixture.event].push(fixture);
  }

  const upcomingEvents = events.filter(event => {
    const eventFixtures = fixturesByEvent[event.id] || [];
    if (eventFixtures.length === 0) return true;
    return !eventFixtures.every(f => f.finished);
  });

  return {
    teams,
    events: upcomingEvents,
    allEvents: events,
    fixturesData,
    elements,
    elementTypes,
  };
};

/**
 * Fetch a manager's current squad picks for a given gameweek.
 * @param {number} entryId
 * @param {number} eventId
 */
export const fetchEntryPicks = async (entryId, eventId) => {
  const url = `${BASE}/entry/${entryId}/event/${eventId}/picks/`;
  const res = await axios.get(proxied(url));
  return res.data;
};

/**
 * Fetch a manager's entry (team name, chips used, etc.).
 * @param {number} entryId
 */
export const fetchEntry = async (entryId) => {
  const url = `${BASE}/entry/${entryId}/`;
  const res = await axios.get(proxied(url));
  return res.data;
};

/**
 * Fetch live points data for a gameweek (used for historical accuracy view).
 * @param {number} eventId
 */
export const fetchEventLive = async (eventId) => {
  const url = `${BASE}/event/${eventId}/live/`;
  const res = await axios.get(proxied(url));
  return res.data;
};
