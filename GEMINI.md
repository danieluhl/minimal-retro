# Project Overview

This is a [Remix](https://remix.run/) web application. It uses [Vite](https://vitejs.dev/) for frontend tooling, [React](https://reactjs.org/) as the view layer, and [Tailwind CSS](https://tailwindcss.com/) for styling. The project is configured with TypeScript and includes linting and type-checking scripts.

The application structure follows the standard Remix conventions, with routes defined in the `app/routes` directory. The root layout is defined in `app/root.tsx`, which also includes the global CSS and font imports.

# Building and Running

## Development

To run the development server, use the following command:

```shell
npm run dev
```

This will start the Vite development server with hot module reloading.

## Production

To build the application for production, use the following command:

```shell
npm run build
```

This will create a production-ready build in the `build` directory.

To run the application in production mode, use the following command:

```shell
npm start
```

This will start the Remix server in production mode.

## Linting and Type-Checking

To lint the code, use the following command:

```shell
npm run lint
```

To type-check the code, use the following command:

```shell
npm run typecheck
```

# Development Conventions

## Styling

The project uses [Tailwind CSS](https://tailwindcss.com/) for styling. The configuration is in `tailwind.config.ts`. The main stylesheet is located at `app/tailwind.css`.

## Components

The project uses a component-based architecture. Reusable components are located in the `app/components` directory.

## Routing

The project uses the file-based routing system from Remix. Routes are defined in the `app/routes` directory.

## Deployment

The project can be deployed to any Node.js hosting provider. The `fly.toml` file suggests that the project is configured for deployment on [Fly.io](https://fly.io/).
