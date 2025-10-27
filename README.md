# Class Cashier

Class Cashier is a Next.js application designed to help manage class finances. It provides a simple and transparent way to track income and expenses, member dues, and overall financial status. The application uses Firebase for its backend and is built with Next.js, Tailwind CSS, and Shadcn UI.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Dependencies](#dependencies)
- [Contributing](#contributing)

## Features

- **Member Management**: Add, update, and delete class members.
- **Transaction Tracking**: Record income and expenses with details such as amount, date, description, and associated member.
- **Dues Management**: Set up weekly or monthly dues and track member payments.
- **Financial Overview**: View a summary of the class's financial status, including total income, total expenses, and current balance.
- **Authentication**: Secure admin dashboard for managing the application.
- **Responsive Design**: The application is designed to work on both desktop and mobile devices.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [Firebase](https://firebase.google.com/) project

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/class-cashier.git
   cd class-cashier
   ```

2. **Install the dependencies:**

   ```bash
   npm install
   ```

3. **Set up your Firebase project:**

   - Create a new project on the [Firebase Console](https://console.firebase.google.com/).
   - Go to your project settings and copy your Firebase configuration.
   - Create a `.env.local` file in the root of the project and add your Firebase configuration.

## Environment Variables

To run this project, you will need to add the following environment variables to your `.env.local` file:

`NEXT_PUBLIC_FIREBASE_API_KEY`
`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
`NEXT_PUBLIC_FIREBASE_PROJECT_ID`
`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
`NEXT_PUBLIC_FIREBASE_APP_ID`
`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

## Available Scripts

In the project directory, you can run:

- `npm run dev`: Runs the app in development mode.
- `npm run build`: Builds the app for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Lints the code.
- `npm run typecheck`: Type-checks the code.

## Project Structure

The project structure is as follows:

- `src/app`: Contains the pages of the application.
- `src/components`: Contains the reusable components.
- `src/lib`: Contains the core logic of the application, such as Firebase configuration, data types, and server actions.
- `public`: Contains the static assets of the application.

## Dependencies

The main dependencies of the project are:

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Lucide React](https://lucide.dev/)
- [date-fns](https://date-fns.org/)
- [Zod](https://zod.dev/)

## Contributing

Contributions are welcome! If you have any ideas, suggestions, or bug reports, please open an issue or submit a pull request.
