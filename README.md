This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:


You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Football Auction

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` for same-device testing. A `192.168.x.x` invite
only works for devices on the same Wi-Fi network.

## Friends on different networks

Use the public development command so the app and every API route share one
public HTTPS origin:

```bash
npm run dev:public
```

Wait for the `Public invite URL` message, then:

1. Open the displayed HTTPS URL on the host computer.
2. Create the auction and copy the Invite Link from the lobby.
3. Send that exact HTTPS link to friends. Do not send `localhost` or a
	`192.168.x.x` address.
4. Everyone signs in with a separate account and allows camera/microphone
	access when prompted.

The public command uses a temporary Cloudflare Tunnel. Keep its terminal open
for the entire auction. The URL changes when the command is restarted.

## Environment

Copy `.env.example` to `.env` and set a shared MongoDB Atlas connection:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=football-auction
```

For a stable deployment, set `NEXT_PUBLIC_APP_URL` to the deployed HTTPS URL.
For the most reliable camera and microphone connections across home networks,
set `TURN_URLS`, `TURN_USERNAME`, and `TURN_CREDENTIAL`; the app has public
fallback relays for development.

## Verification

```bash
npm run typecheck
npm run lint
npm run build
```
