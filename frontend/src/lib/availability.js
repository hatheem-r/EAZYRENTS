import { subDays, startOfToday, isBefore, isWithinInterval, eachDayOfInterval } from 'date-fns'

// The backend requires full ISO 8601 datetimes with a literal "Z" (zod's
// z.string().datetime() rejects a bare offset like "+00:00"). DayPicker gives
// us Date objects anchored to the calendar day in the browser's local
// timezone, so re-anchor to UTC midnight before serializing — otherwise
// toISOString() could shift the selected day backward/forward for guests
// west/east of UTC.
export function toUtcMidnightIso(date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString()
}

export function buildDisabledMatchers(unavailableDates) {
  const pastDays = { before: startOfToday() }

  const bookedRanges = unavailableDates.map(({ start_date, end_date }) => ({
    from: new Date(start_date),
    // end_date is the checkout day (exclusive) — the guest/host can still
    // check out that morning, so the last actually-blocked night is the day
    // before. Same adjustment used everywhere unavailable_dates is disabled.
    to: subDays(new Date(end_date), 1),
  }))

  return [pastDays, ...bookedRanges]
}

export function rangeOverlapsDisabled(range, disabledMatchers) {
  if (!range?.from || !range?.to) return false

  const days = eachDayOfInterval({ start: range.from, end: range.to })

  return days.some((day) =>
    disabledMatchers.some((matcher) =>
      matcher.before ? isBefore(day, matcher.before) : isWithinInterval(day, { start: matcher.from, end: matcher.to }),
    ),
  )
}
