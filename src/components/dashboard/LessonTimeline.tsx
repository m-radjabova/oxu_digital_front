import type { ReactNode } from 'react'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import type { Lesson } from '../../types'
import { lessonGroupNames, lessonTypeLabel } from '../../utils/lessons'
import { getPeriod, periodStatus, type LessonTimeStatus } from '../../utils/periods'
import Badge from '../ui/Badge'
import { subjectColor } from './styles'

const STATUS_BADGE: Record<LessonTimeStatus, ReactNode> = {
  live: <Badge tone="success" dot className="animate-pulse">Hozir</Badge>,
  upcoming: <Badge tone="info">Kutilmoqda</Badge>,
  done: <Badge tone="neutral">Tugadi</Badge>,
}

export default function LessonTimeline({
  lessons,
  now,
  showTeacher = false,
  showGroups = true,
  renderAction,
}: {
  lessons: Lesson[]
  now: Date
  showTeacher?: boolean
  showGroups?: boolean
  renderAction?: (lesson: Lesson, status: LessonTimeStatus) => ReactNode
}) {
  return (
    <ol className="relative grid gap-3">
      {lessons.map((lesson, index) => {
        const period = getPeriod(lesson.period)
        const status = periodStatus(lesson.period, now)
        const color = subjectColor(lesson.subject.color)
        const isLast = index === lessons.length - 1
        return (
          <li key={lesson.id} className="relative flex gap-3 animate-slide-up sm:gap-4" style={{ animationDelay: `${index * 50}ms` }}>
            <div className="flex w-14 shrink-0 flex-col items-end pt-3 text-right sm:w-16">
              <span className={`text-sm font-bold ${status === 'done' ? 'text-slate-400' : 'text-slate-900'}`}>{period?.start}</span>
              <span className="text-[11px] text-slate-400">{period?.end}</span>
            </div>

            <div className="relative flex flex-col items-center pt-4">
              <span
                className={`relative z-10 size-3 rounded-full ring-4 ${status === 'live' ? 'ring-emerald-100' : 'ring-surface'}`}
                style={{ backgroundColor: status === 'done' ? 'var(--color-slate-300)' : color }}
              />
              {!isLast && <span className="absolute bottom-[-12px] top-6 w-px bg-slate-200" aria-hidden="true" />}
            </div>

            <div
              className={`min-w-0 flex-1 rounded-2xl border bg-surface p-3.5 transition sm:p-4 ${
                status === 'live'
                  ? 'border-emerald-200 shadow-[0_12px_30px_-18px_rgb(16_185_129/0.6)] ring-1 ring-emerald-100'
                  : status === 'done'
                    ? 'border-slate-100 bg-slate-50/60'
                    : 'border-slate-200/80 hover:border-slate-300'
              }`}
              style={{ borderLeftWidth: 4, borderLeftColor: status === 'done' ? 'var(--color-slate-200)' : color }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`truncate text-[15px] font-bold ${status === 'done' ? 'text-slate-500' : 'text-slate-900'}`}>
                    {lesson.subject.name}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    {lesson.period}-para · {lessonTypeLabel(lesson.type)}
                  </p>
                </div>
                {STATUS_BADGE[status]}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <AccessTimeRoundedIcon sx={{ fontSize: 14 }} />
                  {period ? `${period.start} — ${period.end}` : '—'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MeetingRoomRoundedIcon sx={{ fontSize: 14 }} />
                  {lesson.room || 'Xona belgilanmagan'}
                </span>
                {showGroups && (
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <GroupsRoundedIcon sx={{ fontSize: 14 }} />
                    <span className="truncate">{lessonGroupNames(lesson)}</span>
                  </span>
                )}
                {showTeacher && (
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <PersonRoundedIcon sx={{ fontSize: 14 }} />
                    <span className="truncate">{lesson.teacher?.name || '—'}</span>
                  </span>
                )}
              </div>
              {renderAction && <div className="mt-3 empty:hidden">{renderAction(lesson, status)}</div>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
