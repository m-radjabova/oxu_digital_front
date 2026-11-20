# OXU Digital frontend

React, TypeScript, React Router, Tailwind CSS, Material UI icons va React Hook Form bilan tayyorlangan dars jadvali kabineti.

## Ishga tushirish

1. `npm install`
2. `.env.example` faylidan `.env` yarating. Production API manzilini `VITE_API_ORIGIN` orqali belgilang. Developmentda Vite server `/auth`, `/attendance`, `/users`, `/groups`, `/subjects`, `/lessons` va `/health` so‘rovlarini `http://127.0.0.1:5050` ga proxy qiladi. Admin hisoblar ro‘yxati va o‘qituvchilar jadvali serverdan 15 tadan sahifalab yuklanadi.
3. `npm run dev`

Production tekshiruvi uchun `npm run build`, kod tekshiruvi uchun `npm run lint`.

## Tuzilma

- `src/App.tsx` — React Router yo‘llari va rolga bog‘langan himoyalangan marshrutlar.
- `src/pages/admin`, `src/pages/teacher`, `src/pages/student` — har bir rolning alohida kabinet sahifalari.
- `src/components` — umumiy sidebar, layout, jadval va shakl qismlari.
- `src/hooks/useUsers.ts`, `useGroups.ts`, `useSubjects.ts`, `useLessons.ts` — ma’lumotlarni API’dan olish va yozish.
- `src/components/AuthProvider.tsx`, `src/hooks/useAuth.ts` — login holati va token boshqaruvi.

Admin `/admin`, o‘qituvchi `/teacher`, talaba `/student` kabinetiga yo‘naltiriladi. Rolga mos bo‘lmagan sahifaga kirish `ProtectedRoute` tomonidan rad etiladi.
