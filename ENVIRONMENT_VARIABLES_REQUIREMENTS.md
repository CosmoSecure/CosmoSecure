# Environment Variables

This document lists all the environment variables required for the project.

## Required Variables

- `VITE_SECRET_KEY`: The secret key used for encryption.
- `MONGO_URI`: The connection string for the database.
- `TOKEN_SECRET`: The secret key used for JWT token generation.
- `API_URL`: The base URL for the API.

## Example `.env` File

```ruby
# frontend env:

VITE_SECRET_KEY=your_secret_key

# backend env:

TOKEN_SECRET=your_jwt_secret

MONGO_URI=mongodb://localhost:27017

API_URL=https://api.example.com
```

## Locations for `.env` Files

1. **Frontend**: Place the `.env` file in the root directory of the frontend project.
2. **Backend**: Place the `.env` file in the `src-tauri` directory of the backend project.