/**
 * Shared JSDoc typedefs for the FPL API shapes used across the app.
 * These exist so editors (and future TS migration) can reason about data flow
 * without having to inspect the raw `bootstrap-static` response.
 *
 * @typedef {Object} Team
 * @property {number} id
 * @property {string} name
 * @property {string} short_name
 * @property {number} code
 * @property {number} strength
 * @property {number} strength_overall_home
 * @property {number} strength_overall_away
 * @property {number} strength_attack_home
 * @property {number} strength_attack_away
 * @property {number} strength_defence_home
 * @property {number} strength_defence_away
 * @property {string} logoUrl
 *
 * @typedef {Object} Event
 * @property {number} id
 * @property {string} name
 * @property {boolean} finished
 * @property {boolean} is_current
 * @property {boolean} is_next
 * @property {string} [deadline_time]
 *
 * @typedef {Object} Fixture
 * @property {number} id
 * @property {number} event
 * @property {number} team_h
 * @property {number} team_a
 * @property {number} team_h_difficulty
 * @property {number} team_a_difficulty
 * @property {number|null} team_h_score
 * @property {number|null} team_a_score
 * @property {string} kickoff_time
 * @property {boolean} finished
 *
 * @typedef {Object} Player
 * @property {number} id
 * @property {number} team
 * @property {number} element_type
 * @property {string} first_name
 * @property {string} second_name
 * @property {string} web_name
 * @property {string} form
 * @property {number} now_cost
 * @property {number} total_points
 * @property {string} selected_by_percent
 *
 * @typedef {Object} ProcessedFixture
 * @property {number} id
 * @property {number} eventId
 * @property {Team} opponentTeam
 * @property {boolean} isHome
 * @property {number} fdr
 * @property {number} rawFdr
 * @property {string} kickoffTime
 * @property {boolean} finished
 *
 * @typedef {{ eventId: number } & ({ isBlank: true } | { isBlank: false, fixtures: ProcessedFixture[] })} GameweekSlot
 *
 * @typedef {Object} ProcessedTeam
 * @property {Team} team - original team record; id/name/etc spread onto the top-level
 * @property {number} id
 * @property {string} name
 * @property {string} short_name
 * @property {string} logoUrl
 * @property {number} avgFDR
 * @property {GameweekSlot[]} teamFixtures
 *
 * @typedef {'default' | 'easiest' | 'hardest'} SortOrder
 * @typedef {'overall' | 'attack' | 'defence'} FDRMode
 * @typedef {'official' | 'linear' | 'strength' | 'form'} FDRAlgorithm
 */

export {};
