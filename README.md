# K11 Fitness Academy: Student Certificate Verification

A lightweight verification site. Visitors enter a certificate ID and see whether it matches an official record.

```
public/   static site (served publicly)
api/      serverless function that looks up one ID at a time
data/     certificate records (private: never served to browsers)
```

## 1. Add your information

**Certificate records:** edit `data/certificates.json`:

```json
[
  { "id": "CERTIFICATE-ID", "name": "Full Name", "course": "Course Name", "issued": "2026-03-15", "status": "Valid" }
]
```

`status` can be `Valid`, `Revoked`, or `Expired`. IDs are matched case-insensitively.

**Contact details and social links:** edit `public/site.json`. Any field left blank is hidden on the site.

## 2. Deploy

1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com/new), import the repository. No framework or build command is needed; `vercel.json` handles configuration.
3. Deploy. Add your custom domain under Project → Settings → Domains.

To update records later, edit `data/certificates.json`, commit, and push. Vercel redeploys automatically.

## Notes

- Keep the repository **private**: it contains student records.
- Only the matched record's name, ID, course, issue date, and status are returned by the API.
- The API has basic rate limiting. For stronger protection, enable Vercel's Firewall / rate-limit rules.
- For large datasets or frequent changes, replace the JSON file with a database (e.g. Vercel Postgres or Supabase) inside `api/verify.js`.

## Local development

```
npm i -g vercel
vercel dev
```
