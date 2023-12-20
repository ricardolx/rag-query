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

### Function ENV variables /functions.env
CLIENT_ID= Google OAuth Client ID


CLIENT_SECRET= Google OAuth Client Secret

REDIRECT_PAGE= The webapp landing page

HANDLER= OAuth Redirect Handler function

OPENAI_KEY=OpenAI Api Key

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
##### Function Permissions and Settings
- GetAuthenticaion (Retrieve Login) - Invocable by anonymous
- OauthRedirect (Handle Redirect) - callable by https
- GetSlides (Retrieve Slides) - Invocable by authenticated user
   - May need more than base 256MB to process slides 
# Architecture

![ArchP](https://github.com/ricardolx/slides-app/assets/37557051/0e7d9ce4-ee4e-4cfd-a4bc-fca3eb256835)

