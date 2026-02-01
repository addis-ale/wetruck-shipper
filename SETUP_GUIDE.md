# WeTruck Shipper Frontend - Local Setup Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Steps](#installation-steps)
3. [Configuration](#configuration)
4. [Running the Application](#running-the-application)
5. [Troubleshooting](#troubleshooting)
6. [Available Commands](#available-commands)

---

## Prerequisites

Before you begin, you need to install the following software on your computer:

### 1. Node.js (Required)

Node.js is a JavaScript runtime that allows you to run this application.

**Installation:**

- Visit [https://nodejs.org/](https://nodejs.org/)
- Download the **LTS (Long Term Support)** version for your operating system
- Run the installer and follow the installation wizard
- Accept all default settings

**Verify Installation:**
Open your terminal/command prompt and type:

```bash
node --version
```

You should see a version number like `v20.x.x` or higher.

```bash
npm --version
```

You should see a version number like `10.x.x` or higher.

### 2. Git (Optional but Recommended)

Git is used to download and manage the code.

**Installation:**

- Visit [https://git-scm.com/downloads](https://git-scm.com/downloads)
- Download and install for your operating system
- Accept all default settings during installation

**Verify Installation:**

```bash
git --version
```

### 3. A Code Editor (Optional but Helpful)

- **VS Code** (Recommended): [https://code.visualstudio.com/](https://code.visualstudio.com/)
- Or any text editor of your choice

---

## Installation Steps

### Step 1: Get the Code

**Option A: If you have Git installed**

1. Open your terminal/command prompt
2. Navigate to where you want to store the project:
   ```bash
   cd Desktop
   ```
3. Clone the repository:
   ```bash
   git clone <repository-url>
   cd wetruck/frontend/shipper
   ```

**Option B: If you don't have Git**

1. Download the project as a ZIP file from your repository
2. Extract the ZIP file to a location on your computer
3. Open terminal/command prompt and navigate to the extracted folder:
   ```bash
   cd path/to/wetruck/frontend/shipper
   ```

### Step 2: Install Dependencies

This step downloads all the necessary packages the application needs to run.

1. Make sure you're in the project folder (you should see `package.json` file here)
2. Run the following command:
   ```bash
   npm install
   ```
3. Wait for the installation to complete (this may take 2-5 minutes)
4. You should see a `node_modules` folder created in your project directory

**Note:** If you see any warnings (yellow text), that's usually okay. Errors (red text) need attention.

---

## Configuration

### Step 1: Set Up Environment Variables

Environment variables tell the application where to find the backend API.

1. In the project folder, you should see a file named `.env.example`
2. Create a copy of this file and rename it to `.env.local`

**On Windows:**

```bash
copy .env.example .env.local
```

**On Mac/Linux:**

```bash
cp .env.example .env.local
```

3. Open `.env.local` in a text editor
4. You should see something like:
   ```
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   ```
5. If your backend API runs on a different URL or port, update this value
6. Save the file

**Important:** The `.env.local` file contains configuration specific to your machine and should NOT be shared or committed to version control.

---

## Running the Application

### Step 1: Start the Development Server

1. Make sure you're in the project folder
2. Run the following command:
   ```bash
   npm run dev
   ```
3. Wait for the server to start (usually takes 10-30 seconds)
4. You should see output like:
   ```
   ▲ Next.js 16.1.4
   - Local:        http://localhost:3000
   - Ready in 2.5s
   ```

### Step 2: Open the Application

1. Open your web browser (Chrome, Firefox, Edge, Safari, etc.)
2. Go to: [http://localhost:3000](http://localhost:3000)
3. You should see the WeTruck Shipper application

**Note:** The application will automatically reload when you make changes to the code.

### Step 3: Stop the Server

When you're done working:

- Press `Ctrl + C` in the terminal where the server is running
- Confirm if prompted

---

## Troubleshooting

### Problem: "npm: command not found" or "node: command not found"

**Solution:** Node.js is not installed or not in your system PATH.

- Reinstall Node.js from [nodejs.org](https://nodejs.org/)
- Restart your terminal after installation

### Problem: "Port 3000 is already in use"

**Solution:** Another application is using port 3000.

- Stop the other application, or
- Run on a different port:
  ```bash
  npm run dev -- -p 3001
  ```
  Then open [http://localhost:3001](http://localhost:3001)

### Problem: "Cannot find module" errors

**Solution:** Dependencies are not installed properly.

```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install
```

### Problem: "Failed to fetch" or API errors

**Solution:** The backend API is not running or the URL is incorrect.

- Make sure your backend server is running
- Check the `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify you can access the API URL in your browser

### Problem: Application shows blank page

**Solution:**

1. Check the browser console for errors (Press F12, go to Console tab)
2. Make sure you're using a modern browser (Chrome, Firefox, Edge, Safari)
3. Clear your browser cache and reload (Ctrl + Shift + R or Cmd + Shift + R)

### Problem: Changes not showing up

**Solution:**

1. Make sure the development server is running
2. Hard refresh your browser (Ctrl + Shift + R or Cmd + Shift + R)
3. Check if there are any errors in the terminal

---

## Available Commands

Here are the main commands you can run in the project:

### Development

```bash
npm run dev
```

Starts the development server with hot-reload (changes appear automatically).

### Development (Turbo Mode)

```bash
npm run dev:turbo
```

Starts the development server with Turbopack for faster builds (experimental).

### Build for Production

```bash
npm run build
```

Creates an optimized production build of the application.

### Run Production Build

```bash
npm run start
```

Runs the production build (you must run `npm run build` first).

### Linting (Code Quality Check)

```bash
npm run lint
```

Checks your code for potential errors and style issues.

### Type Checking

```bash
npx tsc --noEmit
```

Checks for TypeScript type errors without generating output files.

---

## Project Structure

```
shipper/
├── src/
│   ├── app/                    # Application pages and routes
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Dashboard pages
│   │   └── modules/           # Feature modules
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Utility functions and constants
│   └── styles/                # Global styles
├── public/                    # Static files (images, icons)
├── .env.local                 # Environment variables (create this)
├── .env.example               # Example environment variables
├── package.json               # Project dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── next.config.ts             # Next.js configuration
```

---

## Technology Stack

This project uses:

- **Next.js 16** - React framework for web applications
- **React 19** - JavaScript library for building user interfaces
- **TypeScript** - Typed superset of JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **TanStack Query** - Data fetching and caching
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Shadcn UI** - Component library

---

## Getting Help

If you encounter issues not covered in this guide:

1. **Check the Terminal Output:** Error messages often contain helpful information
2. **Check the Browser Console:** Press F12 and look at the Console tab
3. **Search for the Error:** Copy the error message and search on Google or Stack Overflow
4. **Ask for Help:** Contact your team lead or project maintainer

---

## Next Steps

Once you have the application running:

1. **Explore the Application:** Navigate through different pages
2. **Make a Small Change:** Try editing a text or color to see hot-reload in action
3. **Read the Documentation:** Check out the API documentation and component docs
4. **Start Developing:** Begin working on your assigned tasks

---

## Important Notes

- **Never commit `.env.local`** - This file contains local configuration and should not be shared
- **Always run `npm install`** after pulling new code - Dependencies may have changed
- **Keep Node.js updated** - Check for updates periodically
- **Use the correct Node version** - This project requires Node.js 20 or higher

---

## Quick Reference Card

| Task                     | Command                                        |
| ------------------------ | ---------------------------------------------- |
| Install dependencies     | `npm install`                                  |
| Start development server | `npm run dev`                                  |
| Stop server              | `Ctrl + C`                                     |
| Check for errors         | `npm run lint`                                 |
| Build for production     | `npm run build`                                |
| Open application         | [http://localhost:3000](http://localhost:3000) |

---

**Happy Coding! 🚀**

If you found this guide helpful, consider sharing it with your team members who are setting up their development environment.
