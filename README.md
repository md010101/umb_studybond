# Sesh - Study Group Matching Platform

A collaborative study session platform that connects students for effective peer learning.

## Features

- **Study Partner Matching**: Find study partners for specific courses
- **Real-time Chat**: Communicate with matched study partners
- **Rating System**: Rate your study sessions and partners
- **Course-based Pairing**: Match with students taking the same courses
- **Notification System**: Get notified of new matches and messages

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

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
