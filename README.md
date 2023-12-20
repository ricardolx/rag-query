This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result

## Deploy on Firebase static hosting

- firebase deploy --only hosting

# Backend serverless functions

in the /functions dir

## Deploy backend

- firebase deploy --only functions

### Services to enable in GCP
- Google Drive API
- Google Slides API
- Google Oauth API
- Google Functions
- Firebase Auth
- Firestore
  - Semantic Search API
#### GCP Configuration and Permissions
- App Engine Service Account - Service Account Token Creator to create custom tokens
- OAuth 2.0 Client ID
   - Configure origins and redirects from WebApp
##### Function Permissions
- GetAuthenticaion - Invocable by anonymous
- Handle Redirect - callable by https
- GetSlides - Invocable by authenticated user
# Architecture

![Untitled Diagram](https://github.com/ricardolx/slides-app/assets/37557051/3c6d65b2-0051-4df2-9f66-f9ec56bfc835)
