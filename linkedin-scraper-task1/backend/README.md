Backend API (Express)

Run
```
npm install
npm start
```

Defaults
- Port: 4000 (override with PORT env)
- CORS: allowed origin http://localhost:5173
- Serves images from ../scraper/images at /images

Endpoints
- GET /api/health → { status: "ok" }
- GET /api/profiles?limit=10 → JSON array parsed from ../scraper/profiles.csv
  - 500 error if CSV missing with a helpful message

Examples
- http://localhost:4000/api/health
- http://localhost:4000/api/profiles





