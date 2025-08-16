# Rubric Refiner

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/zqh0421/partimeas.git
cd partimeas
```

### 2. Setup the Environment

#### With VS Code:

1. Install Docker Desktop and make sure it’s running.
2. Install the Dev Containers extension (by Microsoft) in VS Code.
3. When prompted, select “Reopen in Container” to automatically setup the environment. If you don’t see the prompt, press F1 → search for Dev Containers: Reopen in Container.

### 3. Install dependencies

```bash
cd web && pnpm install
```

### 4. Set up environment variables (in `/partimeas/web`)

Add `.env.local` based on the format in `.env.example`.

### 5. Run the development server (in `/partimeas/web`)

```bash
pnpm dev
```

### 6. Open [http://localhost:5666](http://localhost:5666) in your browser.

### 7. (Optional) Test the deployment version

```bash
# (1) Build for production
pnpm build:no-lint

# (2) Start production server
pnpm start
```

## Project Structure ([Next.js App Router](https://nextjs.org/docs/app/getting-started/project-structure))

```
partimeas/
   └── web/
      ├── app/
      │   ├── admin/
      │   │   └── page.tsx             # Settings interface
      │   ├── workshop-assistant/
      │   │   ├── session/
      │   │   │   └── [sessionId]/
      │   │   │        └── page.tsx    # Sharable page for each test case
      │   │   ├── page.tsx             # Main interface
      │   ├── api/                     # Next.js APIs for interactions with LLMs and database
      │   ├── components/
      │   ├── hooks/
      │   ├── types/
      │   ├── utils/
      │   ├── layout.tsx               # Root layout
      │   ├── page.tsx                 # Entry Page
      │   └── globals.css              # Global styles (based on TailwindCSS v4)
      ├── .env.local                # Environment variables
      └── package.json              # Dependencies
```
