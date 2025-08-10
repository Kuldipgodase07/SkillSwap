# SkillSwap
Exchange Skills, Grow Together
> ### Connect with a Community of Coders
>[![Live Demo](https://img.shields.io/badge/Live-Demo-green)](https://skill-swap-1564d.web.app/)
> [![GitHub Follow](https://img.shields.io/github/followers/Kuldipgodase07?label=Follow&style=social)](https://github.com/Kuldipgodase07)
> [![LinkedIn Connect](https://img.shields.io/badge/-Connect%20on%20LinkedIn-blue?style=flat-square&logo=Linkedin&logoColor=white)](https://www.linkedin.com/in/kuldip-godase-b2ba40297/)
> [![Kuldip Godase](https://img.shields.io/badge/-Kuldip%20Godase-blue?style=flat-square)](https://www.linkedin.com/in/kuldip-godase-b2ba40297/)

SkillSwap is a professional platform designed to facilitate the exchange of knowledge and skills between users. Whether you are interested in teaching, learning, or both, SkillSwap provides a trusted environment to connect, communicate, and collaborate for personal and professional growth.



## Key Features

- **User Authentication**: Secure sign-up and login utilizing Firebase Authentication.
- **Skill Discovery**: Browse and search a wide variety of skills offered by users.
- **Intelligent Skill Matching**: Connect with the best matches for your learning and teaching goals.
- **Session Scheduling**: Organize one-on-one or group learning sessions with integrated scheduling tools.
- **Built-in Chat**: Communicate in real-time with other users.
- **Personal Profiles**: Display your skills, experience, and receive feedback.
- **Ratings & Reviews**: Foster trust with transparent, community-driven feedback.
- **Fully Responsive Design**: Optimized for seamless use across desktop, tablet, and mobile devices.
- **Real-time Updates**: Experience instant synchronization across all users and sessions.



## Technology Stack

- **Frontend:** React.js, Material-UI / Tailwind CSS
- **Backend and Database:** Firebase Firestore, Firebase Auth
- **Hosting:** Firebase Hosting
- **Other:** JavaScript (ES6+), Responsive Web Design



## Why SkillSwap?

- **Empowerment:** Learn and teach a diverse range of skills with no boundaries.
- **Community:** Build your network and reputation in a trusted, collaborative ecosystem.
- **Opportunity:** Unlock new skills, career possibilities, and friendships with every exchange.
- **Simplicity:** Intuitive and clean user interface for a seamless experience.



## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Kuldipgodase07/SkillSwap.git
cd SkillSwap
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure Firebase

- Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
- Enable Authentication and Firestore
- Add your Firebase configuration to a `.env` file in the root directory:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

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

### 4. Start the Development Server

```bash
npm start
# or
yarn start
```
Visit [http://localhost:3000](http://localhost:3000) in your browser.



## Screenshots

| Home Page | Skill Listing | Chat & Scheduling |
|-----------|---------------|------------------|
| ![Home Page](https://github.com/Kuldipgodase07/SkillSwap/blob/main/images/home.png?raw=true) | ![Skill Listing](https://github.com/Kuldipgodase07/SkillSwap/blob/main/images/skills.png?raw=true) | ![Chat & Scheduling](https://github.com/Kuldipgodase07/SkillSwap/blob/main/images/chat.png?raw=true) |



## Contribution Guidelines

We welcome contributions from everyone.  
Have an idea or found a bug? Please [open an issue](https://github.com/Kuldipgodase07/SkillSwap/issues) or [submit a pull request](https://github.com/Kuldipgodase07/SkillSwap/pulls).

**How to contribute:**
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request



## License

This project is licensed under the [MIT License](LICENSE).



## Contact

- **GitHub:** [@Kuldipgodase07](https://github.com/Kuldipgodase07)
- **Live App:** [SkillSwap Platform](https://skill-swap-1564d.web.app/)



> Empower yourself and others. Share your expertise, learn what you love, and help build a stronger community—one skill at a time.

- **GitHub:** [@Kuldipgodase07](https://github.com/Kuldipgodase07)
- **Live App:** [SkillSwap Platform](https://skill-swap-1564d.web.app/)

---

> Empower yourself and others. Share your expertise, learn what you love, and help build a stronger community—one skill at a time.
