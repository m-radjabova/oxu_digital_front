import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import { formatDate } from '../../utils/date'
import { lessonGroupNames, lessonTypeLabel } from '../../utils/lessons'
import { formatDuration, periodRange } from '../../utils/periods'
import { dayLabel, type UpcomingLesson } from '../../utils/schedule'
import { Skeleton } from '../ui/Skeleton'

/** Hero ichidagi “shaffof” karta — hozirgi yoki keyingi dars */
export default function NextLessonCard({
  upcoming,
  loading,
  showTeacher = false,
}: {
  upcoming: UpcomingLesson | null
  loading?: boolean
  showTeacher?: boolean
}) {
  const shell = 'rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md sm:p-5'

  if (loading) {
    return (
      <div className={shell} aria-hidden="true">
        <Skeleton className="h-3 w-24 bg-white/20" />
        <Skeleton className="mt-3 h-6 w-48 bg-white/20" />
        <Skeleton className="mt-3 h-3 w-40 bg-white/20" />
      </div>
    )
  }

  if (!upcoming) {
    return (
      <div className={`${shell} flex items-center gap-3`}>
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/15">
          <EventAvailableRoundedIcon />
        </span>
        <div>
          <p className="text-sm font-bold">Bu hafta boshqa dars yo‘q</p>
          <p className="mt-0.5 text-xs text-brand-100">Dam oling — yangi hafta jadvali tez orada.</p>
        </div>
      </div>
    )
  }

  const { lesson } = upcoming
  const label = upcoming.kind === 'live'
    ? 'Hozir davom etmoqda'
    : upcoming.kind === 'today'
      ? 'Keyingi dars'
      : `${dayLabel(lesson.dayOfWeek)}, ${formatDate(upcoming.date)}`
  const timing = upcoming.kind === 'live'
    ? `Tugashiga ${formatDuration(upcoming.minutes)}`
    : upcoming.kind === 'today'
      ? `${formatDuration(upcoming.minutes)}dan so‘ng`
      : 'Eng yaqin dars'

  return (
    <div className={shell}>
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-brand-100">
          {upcoming.kind === 'live' && <span className="size-2 animate-pulse rounded-full bg-emerald-400" />}
          {label}
        </span>
        <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold">{timing}</span>
      </div>
      <p className="mt-3 truncate text-lg font-bold">{lesson.subject.name}</p>
      <p className="text-xs text-brand-100">{lesson.period}-para · {lessonTypeLabel(lesson.type)}</p>
      <div className="mt-3 grid gap-1.5 text-xs text-brand-50">
        <span className="inline-flex items-center gap-1.5">
          <AccessTimeRoundedIcon sx={{ fontSize: 15 }} />
          {periodRange(lesson.period)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MeetingRoomRoundedIcon sx={{ fontSize: 15 }} />
          {lesson.room || 'Xona belgilanmagan'}
        </span>
        {showTeacher ? (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <PersonRoundedIcon sx={{ fontSize: 15 }} />
            <span className="truncate">{lesson.teacher?.name || '—'}</span>
          </span>
        ) : (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <GroupsRoundedIcon sx={{ fontSize: 15 }} />
            <span className="truncate">{lessonGroupNames(lesson)}</span>
          </span>
        )}
      </div>
    </div>
  )
}
