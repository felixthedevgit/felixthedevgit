'use strict';

// Everything the profile shows comes from this one query. It needs a token
// of the profile owner because the calendar is only complete with one: for
// anyone else the API leaves private contributions out, and most of my
// commits happen in private repositories. The token never leaves the
// workflow, the README only ever gets the resulting SVG files.
const QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
            weekday
          }
        }
      }
    }
  }
}`;

const fetchProfile = async (login, token) => {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      authorization: `bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': `${login}-profile`,
    },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  if (!response.ok) throw new Error(`GitHub answered with status ${response.status}.`);
  const json = await response.json();
  if (json.errors) throw new Error(`GitHub reports: ${json.errors.map((e) => e.message).join(', ')}`);

  const calendar = json.data.user.contributionsCollection.contributionCalendar;
  const days = calendar.weeks
    .flatMap((week) => week.contributionDays)
    .map((day) => ({ date: day.date, count: day.contributionCount, weekday: day.weekday }));
  return { fetchedAt: new Date().toISOString(), total: calendar.totalContributions, days };
};

module.exports = { fetchProfile };
