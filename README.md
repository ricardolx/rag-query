Slides app - intelligent querying of large pdf documents. Submit questions to your document and get a fast answer from an AI.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result

#### Firebase authentication required for access to slides page

## Deploy on Firebase static hosting

- firebase deploy --only hosting

# Backend 

## Pine cone

- Get pinecone api key
- Using with npm or pip package
   - Create Index 

## serverless functions

in the /functions dir
- **uploadDocument**
- **questionDocument**

### Function ENV variables /functions.env

OPENAI_KEY=OpenAI Api Key

VECTOR_MODEL= Embedding vector model (OpenAI)

PINECONE_KEY= Pinecone API key

PINECONE_DOCUMENT_INDEX= Pinecone Vector Index

PINECONE_ENVIRONMENT= Pinecone cloud environment

## Deploy backend

- firebase deploy --only functions

### Services to enable in GCP
- Google Functions
- Firebase Auth
- Firestore
  - Semantic Search API
##### Firestore Collections
- pages - contains user page content of the uploaded pages
- embeddings - contains page content embeddings
