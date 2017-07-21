## Dependencies

* Node.js

## Create a Twitter App

* go to [apps.twitter](https://apps.twitter.com/) and create a new application
* under *Keys and Access Tokens* sections generate the access tokens
* create a new `.credentials` file and put the *keys* and *access tokens* from Twitter:

```json
{
  "consumer_key": "your_consumer_key",
  "consumer_secret": "your_consumer_secrete_key",
  "token": "your_access_token",
  "token_secret": "your_access_token_secret"
}
```

## Server

### Setup

* `cd server`
* `npm install`
* `node main.js`

## Client

### Setup

* `cd client`
* `npm run build`
* open `index.html` in a browser

