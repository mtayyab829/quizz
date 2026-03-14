# Project Attention List

## Needs Attention (Functional Gaps / Potential Bugs)
1. Preview for matching is a placeholder instead of a real preview. (`src/pages/QuizBuilder.tsx`)
2. Preview does not indicate correct answers for MCQ/multi-select (may be acceptable, but often expected by admins). (`src/pages/QuizBuilder.tsx`)
3. Validation before publish is minimal; quizzes can be saved with empty question text/options. (`src/pages/QuizBuilder.tsx`)
4. No guard against zero questions before publish. (`src/pages/QuizBuilder.tsx`)

## Needs Improvement (Polish / Incomplete Wiring)
1. Header search input is not wired to any behavior. (`src/components/Layout.tsx`)
2. Analytics search input is not wired to any behavior. (`src/pages/Analytics.tsx`)
3. Dashboard stat trends are hardcoded (`+0%`). (`src/pages/Dashboard.tsx`)
4. Dashboard “More” action button has no onClick. (`src/pages/Dashboard.tsx`)
5. Quiz Builder uses `alert()` for errors; replace with inline validation UI/toasts. (`src/pages/QuizBuilder.tsx`)
6. Active quiz allows finishing only if current answer exists, but doesn’t warn about unanswered previous questions. (`src/pages/ActiveQuiz.tsx`)

## Needs Another Touch (UX / Flow)
1. Non-verbal options are fixed at 4; no add/remove controls. (`src/pages/QuizBuilder.tsx`)
2. Non-verbal image validity is not enforced before publishing. (`src/pages/QuizBuilder.tsx`)
3. Add per-question time limit (optional) for entry-test realism. (`src/pages/QuizBuilder.tsx`, `src/pages/ActiveQuiz.tsx`)
4. Add difficulty tag per question to build balanced quizzes. (`src/pages/QuizBuilder.tsx`, `src/types.ts`)

## Needs Enhancements (Nice-to-haves)
2. Inline image preview while typing URL (builder UX).
3. Bulk import questions from CSV/Excel. (New page + parser)
4. Question bank with tagging, reuse, and randomization. (New pages + data model)
5. Blueprint-based quiz generation (e.g., 10 verbal, 10 non-verbal, 5 math). (New page)
6. Per-question feedback with AI hints (optional, future). (New service)

## Placeholders / Not Linked Yet
1. Settings tabs (Email, Security, Notifications, Backup) show “coming soon.” (`src/pages/Settings.tsx`)
2. Header notification and calendar buttons are unlinked. (`src/components/Layout.tsx`)
3. Analytics “Detailed Quiz Breakdown” search is UI-only. (`src/pages/Analytics.tsx`)

## Suggested New Pages (If Required)
1. Question Bank (search, tag, reuse, archive).
2. Quiz Blueprint Builder (define distribution by type/difficulty/topic).
3. Import Center (CSV/XLSX uploads with validation + preview).
4. Test Simulator (full-length mock tests with timed sections).
5. Admin Review Queue (manual grading for verbal/non-verbal if needed).
