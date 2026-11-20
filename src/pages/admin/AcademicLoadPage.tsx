import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import AcademicLoadOverview from '../../components/AcademicLoadOverview'
import PageHeading from '../../components/PageHeading'

export default function AcademicLoadPage() {
  return <div className="mx-auto w-full max-w-[1600px] px-3 pb-5 sm:px-4 lg:px-5">
    <PageHeading eyebrow="Ta’lim dasturi" title="Akademik soatlar" description="Fan va guruhlar bo‘yicha dars yuklamalarini nazorat qiling." icon={<AccessTimeRoundedIcon />} />
    <AcademicLoadOverview />
  </div>
}
