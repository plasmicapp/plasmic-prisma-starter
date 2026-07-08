# Plasmic & Prisma Starter

This repository provides a boilerplate to quickly set up a Next.js application with authentication using [Auth.js](https://authjs.dev/), [Prisma Postgres](https://www.prisma.io/postgres) and [Prisma ORM](https://www.prisma.io/orm), connect to [Plasmic](https://plasmic.app) and deploy it to Vercel. It includes an easy setup process and example routes that demonstrate basic CRUD operations against the database.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fplasmicapp%2Fplasmic-prisma-starter&env=AUTH_SECRET,DATABASE_URL&envDefaults=%7B%22AUTH_SECRET%22%3A%22Run%20%5C%22npx%20auth%5C%22.%20Read%20more%3A%20https%3A%2F%2Fcli.authjs.dev%22%2C%22DATABASE_URL%22%3A%22postgres%3A%2F%2FUSER%3APASSWORD%40HOST%3A5432%2Fpostgres%3Fsslmode%3Drequire%22%7D&project-name=prisma-plasmic-app&repository-name=prisma-plasmic-app)

## Features

- Next.js 15 app with App Router, Server Actions & API Routes
- Data modeling, database migrations, seeding & querying
- Log in and sign up authentication flows
- CRUD operations to create, view and delete blog posts
- Pagination, filtering & relations queries
- Visual development with Plasmic

## Getting started

### 1. Install dependencies

After cloning the repo and navigating into it, install dependencies:

```
pnpm install
```

### 2. Create a Prisma Postgres instance

Create a Prisma Postgres database by running the following command:

```
npx prisma init --db
```

This command is interactive and will prompt you to:

1. Log in to the [Prisma Console](https://console.prisma.io)
1. Select a **region** for your Prisma Postgres instance
1. Give a **name** to your Prisma project

Once the command has terminated, copy the **Database URL** from the terminal output. You'll need it in the next step when you configure your `.env` file.

### 3. Set up your `.env` file

You now need to configure your database connection via an environment variable.

First, create an `.env` file:

```bash
touch .env
```

To ensure your authentication works properly, you need to set [env vars for NextAuth.js](https://next-auth.js.org/configuration/options):

You can generate a random 32 character string for the `AUTH_SECRET` secret with this command:

```
npx auth secret
```

Then update the `.env` file by replacing the existing `DATABASE_URL` value with the one you previously copied. 

In the end, your entire `.env` file should look similar to this (but using _your own values_ for the env vars):

```bash
DATABASE_URL="postgres://...@db.prisma.io:5432/postgres?sslmode=require"

AUTH_SECRET="gTwLSXFeNWF...pd0k6JqXd7Ag="
```

### 4. Migrate the database

Run the following commands to set up your database and Prisma schema:

```bash
pnpm dlx prisma migrate dev --name init
pnpm dlx prisma generate
```

### 5. Seed the database

Add initial data to your database:

```bash
pnpm dlx prisma db seed
```

You can then run `pnpm dlx prisma studio` to confirm that all the data is in place.

### 6. Create a Plasmic project

Create an account in [Plasmic Studio](https://studio.plasmic.app/), and then follow [this guide](https://docs.plasmic.app/learn/no-code-quickstart/#create-a-new-plasmic-project) to create the project in Plasmic.

### 7. Connect Plasmic to your codebase

You need to connect your Plasmic project with the codebase. To do that, you will need to change following variables in `plasmic-init.ts`:

- `id` - id of your project in Plasmic, can be found in the URL bar when opening the project
- `token` - public project token, can be found when clicking `Code` button in the top right corner of a project navbar.

### 8. Run the app

Start the development server:

```bash
pnpm dev
```


Once the server is running, visit `http://localhost:3000` to start using the app.

### 9. Configure Plasmic project app host

To see your code components inside Plasmic you will need to follow [this short guide](https://docs.plasmic.app/learn/app-hosting/#3-set-your-plasmic-project-to-use-your-app-host) to configure the app host - a bridge between the codebase and the studio.

## Next steps

- [Prisma ORM documentation](https://www.prisma.io/docs/orm)
- [Prisma Client API reference](https://www.prisma.io/docs/orm/prisma-client)
- [Join our Discord community](https://discord.com/invite/prisma)
- [Follow us on Twitter](https://twitter.com/prisma)
