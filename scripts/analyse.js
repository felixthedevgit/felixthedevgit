'use strict';

// Turns the daily calendar into the handful of numbers the profile shows.
// Everything here is derived, nothing is fetched, so the renderers can be
// tried out offline against data/contributions.json.

const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

const analyse = (days) => {
  // GitHub hands the calendar out in weeks from Sunday to Saturday. The
  // first and the last week may be partial, which is fine for a curve.
  const weeks = [];
  for (const day of days) {
    if (weeks.length === 0 || day.weekday === 0) weeks.push({ start: day.date, count: 0 });
    weeks[weeks.length - 1].count += day.count;
  }

  let longest = 0;
  let run = 0;
  for (const day of days) {
    run = day.count > 0 ? run + 1 : 0;
    if (run > longest) longest = run;
  }

  // The current streak counts backwards from the last day. Today may still
  // be empty when the workflow runs in the early morning, so an empty last
  // day does not break the chain.
  let current = 0;
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i -= 1;
  for (; i >= 0 && days[i].count > 0; i -= 1) current += 1;

  const byWeekday = new Array(7).fill(0);
  for (const day of days) byWeekday[day.weekday] += day.count;
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const busiest = byWeekday.indexOf(Math.max(...byWeekday));

  return {
    total,
    weeks,
    longest,
    current,
    activeDays: days.filter((day) => day.count > 0).length,
    dayCount: days.length,
    busiestWeekday: WEEKDAYS[busiest],
    busiestShare: total > 0 ? byWeekday[busiest] / total : 0,
    first: days.length ? days[0].date : null,
    last: days.length ? days[days.length - 1].date : null,
  };
};

module.exports = { analyse, WEEKDAYS };
