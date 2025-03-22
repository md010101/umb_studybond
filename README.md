## Tech Stack

- Frontend: React + TypeScript with Shadcn UI components
- Backend: Express.js
- Database: PostgreSQL with Drizzle ORM
- Authentication: Session-based with Passport.js

## Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Create a .env file with:
DATABASE_URL=postgresql://...
```

3. Start the development server:
```bash
npm run dev
```

## Authentication

- Uses UMB email addresses (@umb.edu)
- Session-based authentication with Passport.js
- Secure password hashing

## Database Schema

- Users (profile, courses, availability)
- Study Requests
- Matches
- Messages
- Ratings
- Notifications
