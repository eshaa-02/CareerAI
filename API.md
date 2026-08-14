# CareerAI — API Reference

Base URL: `{API_URL}/api` (local: `http://localhost:5000/api`)

Auth: send `Authorization: Bearer <token>` (the frontend's axios interceptor
does this automatically once logged in). Endpoints marked **Public** need no
token. Role-restricted endpoints return `403` if the logged-in user's role
doesn't match.

This list was generated directly from `backend/routes/*.js` — if a route is
added or changed there, this file will drift until it's regenerated the same
way (`grep -oE "router\.(get|post|put|delete)\('[^']*'" routes/*.js`).

## Auth — `/api/auth`
| Method | Path | Access |
|---|---|---|
| POST | `/register` | Public |
| POST | `/login` | Public |
| POST | `/logout` | Private |
| GET | `/me` | Private |
| PUT | `/update-password` | Private |
| POST | `/forgot-password` | Public |
| PUT | `/reset-password/:resetToken` | Public |

## Users — `/api/users`
| Method | Path | Access |
|---|---|---|
| PUT | `/me` | Private |
| PUT | `/me/avatar` | Private (multipart) |
| DELETE | `/me` | Private |
| GET | `/:id` | Public |

## Candidates — `/api/candidates`
All routes below require `protect` + `authorize('candidate')`.
| Method | Path |
|---|---|
| GET | `/me` |
| PUT | `/me` |
| PUT | `/me/resume` (multipart) |
| POST / DELETE | `/me/education`, `/me/education/:eduId` |
| POST / DELETE | `/me/experience`, `/me/experience/:expId` |
| POST / DELETE | `/me/certificates`, `/me/certificates/:certId` |
| PUT | `/me/saved-jobs/:jobId` (toggle) |
| GET | `/me/saved-jobs` |
| GET | `/me/match/:jobId` (AI match score for one job) |
| GET | `/me/recommended-jobs` (AI-ranked list) |
| GET | `/me/applications` |

## Companies — `/api/companies`
| Method | Path | Access |
|---|---|---|
| GET | `/` | Public (directory) |
| GET | `/me` | Private (employer) |
| PUT | `/me` | Private (employer) |
| PUT | `/me/logo` | Private (employer, multipart) |
| GET | `/:id` | Public |

## Jobs — `/api/jobs`
| Method | Path | Access |
|---|---|---|
| GET | `/` | Public (search/filter/paginate) |
| GET | `/meta/categories` | Public |
| GET | `/employer/my-jobs` | Private (employer) |
| POST | `/` | Private (employer) |
| GET | `/:id` | Public |
| GET | `/:id/similar` | Public |
| PUT | `/:id` | Private (employer owner / admin) |
| DELETE | `/:id` | Private (employer owner / admin) |

## Applications — `/api/applications`
| Method | Path | Access |
|---|---|---|
| POST | `/:jobId` | Private (candidate) |
| PUT | `/:id/withdraw` | Private (candidate owner) |
| GET | `/job/:jobId` | Private (employer owner / admin) |
| GET | `/employer/all` | Private (employer) |
| PUT | `/:id/status` | Private (employer owner / admin) |
| GET | `/:id` | Private (owner candidate / owner employer / admin) |

## Interviews — `/api/interviews`
| Method | Path | Access |
|---|---|---|
| POST | `/` (schedule) | Private (employer) |
| GET | `/employer` | Private (employer) |
| GET | `/employer/analytics` | Private (employer) |
| PUT | `/:id/reschedule` | Private (employer) |
| PUT | `/:id/cancel` | Private (employer) |
| PUT | `/:id/complete` | Private (employer) |
| PUT | `/:id/outcome` | Private (employer) |
| POST | `/:id/feedback` | Private (employer) |
| PUT | `/:id/notes` | Private (employer) |
| GET | `/admin/analytics` | Private (admin) |
| GET | `/candidate` | Private (candidate) |
| PUT | `/:id/respond` | Private (candidate) |
| PUT | `/:id/join` | Private (candidate) |
| GET | `/:id` | Private (participant) |
| GET | `/:id/calendar.ics` | Private (participant) |

## Notifications — `/api/notifications`
All require `protect`.
| Method | Path |
|---|---|
| GET | `/` |
| PUT | `/read-all` |
| PUT | `/:id/read` |
| DELETE | `/:id` |

## Messages — `/api/messages`
All require `protect`.
| Method | Path |
|---|---|
| GET | `/conversations` |
| POST | `/conversations` |
| GET | `/conversations/:id` |

Live message sending/receiving happens over Socket.io (`message:send`,
`message:new` events), not REST — see `backend/socket/index.js`.

## Admin — `/api/admin`
All require `protect` + `authorize('admin')`.
| Method | Path |
|---|---|
| GET | `/analytics` |
| GET | `/users` |
| PUT | `/users/:id/suspend` |
| DELETE | `/users/:id` |
| GET | `/companies` |
| PUT | `/companies/:id/verify` |
| GET | `/jobs` |
| PUT | `/jobs/:id/close` |

## Employer — `/api/employer`
| Method | Path | Access |
|---|---|---|
| GET | `/analytics` | Private (employer) |

## Stats — `/api/stats`
| Method | Path | Access |
|---|---|---|
| GET | `/public` | Public (homepage counters) |
| GET | `/homepage-content` | Public (latest jobs/companies) |

## Misc
| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | Uptime check, used by Docker `HEALTHCHECK` |
| GET | `/uploads/*` | Static file serving for resumes/avatars/logos |
