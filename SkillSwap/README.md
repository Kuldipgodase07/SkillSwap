# Skill Swap Platform

A modern web application that enables users to exchange skills with each other. Built with React, TypeScript, Tailwind CSS, and Firebase.

## Features

### 🔐 Authentication
- User registration and login with Firebase Authentication
- Secure user profiles with email/password authentication
- Protected routes for authenticated users

### 👤 User Profiles
- Complete user profiles with bio, location, and skills
- Editable profile information
- User ratings and statistics
- Skills management (teaching and learning)

### 🎯 Skill Management
- Add skills you want to teach or learn
- Categorize skills (Programming, Design, Photography, etc.)
- Set skill levels (Beginner, Intermediate, Advanced)
- Availability and preferred exchange options
- Search and filter skills by category and type

### 💬 Messaging System
- Real-time messaging between users
- Conversation management
- Message history and timestamps
- Search conversations

### 📊 Dashboard
- User statistics and overview
- Quick actions for common tasks
- Recent activity tracking
- Profile completion suggestions

### 🎨 Modern UI/UX
- Responsive design for all devices
- Modern, clean interface with Tailwind CSS
- Smooth animations and transitions
- Intuitive navigation

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase
  - Authentication
  - Firestore Database
  - Real-time updates
- **Icons**: Lucide React
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd skill-swap-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Get your Firebase configuration

4. **Configure Firebase**
   - Open `src/firebase/config.ts`
   - Replace the placeholder configuration with your actual Firebase config:
   ```typescript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id"
   };
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.tsx     # Navigation component
│   └── PrivateRoute.tsx # Protected route wrapper
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── firebase/           # Firebase configuration
│   └── config.ts      # Firebase setup
├── pages/              # Page components
│   ├── Dashboard.tsx   # User dashboard
│   ├── Home.tsx        # Landing page
│   ├── Login.tsx       # Login page
│   ├── Messages.tsx    # Messaging page
│   ├── Profile.tsx     # User profile
│   ├── Register.tsx    # Registration page
│   └── SkillListings.tsx # Skills management
├── types/              # TypeScript type definitions
│   └── index.ts        # Application types
├── App.tsx             # Main app component
├── index.tsx           # App entry point
└── index.css           # Global styles
```

## Firebase Collections

### Users
```typescript
{
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  skillsToTeach: Skill[];
  skillsToLearn: Skill[];
  rating?: number;
  totalRatings?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### SkillListings
```typescript
{
  id: string;
  userId: string;
  skill: Skill;
  type: 'teach' | 'learn';
  description: string;
  availability: string;
  preferredExchange?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Conversations
```typescript
{
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: Date;
}
```

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@skillswap.com or create an issue in the repository.

---

**Note**: This is a demo application. For production use, consider implementing additional security measures, error handling, and performance optimizations. 