# Hey Siri, should I open my window?

http service that queries Open Weather API and Ecobee to answer the question if you should open your window. Create an iOS shortcut to ask Siri if you should open your window.

## Requirements

#### To register for an account:

* Goto https://www.ecobee.com/developers
* Click on **Become a Developer**
* Sign in with your ecobee account
* Agree to the terms

> ⚠️ The developer sign up doesn't play well with two-factor authentication turned on. If you have 2FA enabled make sure you disable it on your phone before signing up. You can always reenable it after signing up.

### Open Weather Map API Account

* Sign up for an account on: https://openweathermap.org/
* Once confirming the sign up e-mail
* Navigate to **My API Keys**
* Copy the appId from your apps page

> ⚠️ App IDs takes time to get enabled so if you get an error abount an invalid app ID wait awhile.

### Shortcuts app installed on your iOS Device

Download this app if you don't already have it on your phone:
[https://apps.apple.com/us/app/shortcuts/id1462947752]()

## Installation

### Clone repo or npm install

```
npm install -g @hyperlink/open-window-service
```


### Get token to access ecobee

This step is a bit manual unfortunately. I didn't take any time to make this easy because is a one time taks. You're all setup once you get your `refresh_token`.

#### Login to Ecobee account

Once Ecobee developer account is registered login to your account and click **Developer** link to create an app. Fill out Application Name, Application Summary and make note of the **API key**. This key is what you would use in place for `ECOBEE_CLIENT_ID` environment variable

Make an http GET to  `https://api.ecobee.com/authorize?client_id=<your client ID>&response_type=ecobeePin&scope=smartWrite`

that gives you a response:

```json
{
    "ecobeePin": "XXXX-ABCD",
    "code": "<code needed for next request>",
    "interval": 5,
    "expires_in": 900,
    "scope": "openid,offline_access,smartWrite"
}
```

Then make a http `POST` to 
`https://api.ecobee.com/token?grant_type=refresh_token&code=<code from above>&client_id=<your client ID>`

To get the follow result.

```json
{
    "access_token": "<really long string>",
    "token_type": "Bearer",
    "refresh_token": "<refresh_token>",
    "expires_in": 3600,
    "scope": "openid,smartWrite,offline_access"
}
```

`ECOBEE_REFRESH_TOKEN` should be the `refresh_token` result.

### Get app ID from Open Weather

Set the app ID to `WEATHER_APP_ID`



## Start the service

You can create a script to launch this or use PM2.


```
module.exports = {
  apps: [{
    name: 'Open Window Service',
    exec_mode: 'fork',
    instances: 1,
    script: 'src/index.ts',
    time: true,
    watch: 'src',
    env: {
      WEATHER_APP_ID: '<YOUR APP ID>',
      ECOBEE_REFRESH_TOKEN: '<YOUR TOKEN>',
      ECOBEE_CLIENT_ID: '<YOUR CLIENT ID>',
      // port the endpoint it's going to be on
      PORT: 3000
    }
  }]
};

```

