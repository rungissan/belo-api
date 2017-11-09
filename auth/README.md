# Oauth2

oAuth 2.0 used to authenticate and authorize client applications and users.
All routes are protected except public routes for registration and verification

## Registration

To register user use post request to route /clients include "email" and "password" to request body. Request should have additional header:
```
curl -X POST \
  http://localhost/api/clients \
  -H 'authorization: Basic base64_encoded_client_credentials' \
  -d '{
  "email": "john@doe.com",
  "password": "test"
}'
```
where include client_id:client_secret string encoded in Base64. In response email with verification code would be sent.

## Email verification

To continue registration user should confirm email. Use get query with "userId" and "code" params:
```
curl -X GET \
  'http://localhost/api/clients/confirm-email?userId=24&code=123456' \
  -H 'authorization: Basic base64_encoded_client_credentials' \
```

## Login

After email verified user can login. Use query with "grant_type": "password" and user email, password in body:
```
curl -X POST \
  http://localhost/auth/oauth/token \
  -H 'authorization: Basic base64_encoded_client_credentials' \
  -H 'content-type: application/json' \
  -d '{
  "grant_type": "password",
  "username": "john@doe.com",
  "password": "test",
  "scope": "DEFAULT"
}'
```
As result will receive access_token and refresh_token.
```
{
  "access_token": "L0eht7rL1t2OrklObpaeQgWUshRybVLq",
  "expires_in": 3600,
  "scope": "DEFAULT",
  "refresh_token": "9uLUFbtyDeukKHPFVqhbWKe318YTkUjT",
  "token_type": "Bearer"
}
```

## Api query

Using access_token user can query protected resources. Add access_token as Authorization header:
```
curl -X GET \
  http://localhost/api/protected_route \
  -H 'authorization: Bearer B9IxYcexCOpgEMQnGr6EQ3VWVz4iKQjM' \
```

## Refresh token

After access token expire, use refresh_token to get new access token.
```
curl -X POST \
  http://localhost/auth/oauth/token \
  -H 'authorization: Basic base64_encoded_client_credentials' \
  -H 'content-type: application/json' \
  -d '{
  "grant_type": "refresh_token",
  "token": "L0eht7rL1t2OrklObpaeQgWUshRybVLq",
  "refresh_token": "9uLUFbtyDeukKHPFVqhbWKe318YTkUjT"
}'
```

## Reset password

To change forgotten password use /clients/password-reset route:
```
curl -X POST \
  http://localhost/api/clients/password-reset \
  -H 'authorization: Basic base64_encoded_client_credentials' \
  -H 'content-type: application/json' \
  -d '{
	"email": "john@doe.com"
}'
```
After that short code would be generated and sent to email.
To change forgotten password use /clients/password-update route, include email, newPassword and code from email to request body
```
curl -X POST \
  http://localhost/api/clients/password-update \
  -H 'authorization: Basic bG9jYWxfc3BpdGk6cXdlcnF3ZXJxd2Vy' \
  -H 'content-type: application/json' \
  -d '{
  "email": "john@doe.com"
	"newPassword": "newpassword",
	"code": "X21VPM"
}'
```
