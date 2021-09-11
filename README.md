# Crypter

Internal script for User Service team

# Project local Set-up steps:

#### Step 0

- Install [Homebrew](https://brew.sh/)
- Install [NVM](https://formulae.brew.sh/formula/nvm)
- Install node with Brew
  - `nvm install --lts`

#### Step 1 - Add `.env` file into root folder

```bash
AUTH_TOKEN="<Token>"
SEGMENT_ID="<Default Segment Id>"
USER_SERVICE_HOST=""
USER_ID="<Default User Id>"
USER_EMAIL="<Default User Email>"
```

#### Step 2 - Install dependencies

`npm install`

#### Step 3 - Build Project

`npm run build` or `yarn build`

#### Step 4 - Link to bash

`npm run link` or `yarn link`

#### Step 5 - See Crypter documentation for details

```bash
crypter --help
```

or

```bash
crypter -p
```
