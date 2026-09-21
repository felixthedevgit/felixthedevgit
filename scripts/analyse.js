'use strict';

// Turns the daily calendar into the handful of numbers the profile shows.
// Everything here is derived, nothing is fetched, so the renderers can be
// tried out offline against data/contributions.json.

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const analyse = (days) => {
  // GitHub hands the calendar out in weeks from Sunday to Saturday. The
  // first and the last week may be partial, which is fine for the picture.
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

  // Four shades like GitHub's own calendar, cut at the quartiles of the
  // active days rather than at fixed counts: a quiet year and a busy one
  // then both use the whole range instead of one flat colour.
  const active = days.map((day) => day.count).filter((count) => count > 0).sort((a, b) => a - b);
  const quartile = (q) => (active.length ? active[Math.min(active.length - 1, Math.floor(active.length * q))] : 0);

  return {
    days,
    total,
    weeks,
    longest,
    current,
    activeDays: active.length,
    dayCount: days.length,
    maxDaily: active.length ? active[active.length - 1] : 0,
    thresholds: [quartile(0.25), quartile(0.5), quartile(0.75)],
    byWeekday,
    busiestWeekday: WEEKDAYS[busiest],
    busiestShare: total > 0 ? byWeekday[busiest] / total : 0,
    first: days.length ? days[0].date : null,
    last: days.length ? days[days.length - 1].date : null,
  };
};

module.exports = { analyse, WEEKDAYS };
