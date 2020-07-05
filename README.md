# Express Auth App for ShopUp Interview

Simple express authentication app for interview at shopup.

## Installation

- Clone this repo & `cd` into that directory.

- Install `npm` packages

```
npm i
```

- Create a `.env` file & paste content from `.env.example`
- Update environment variables value in `.env`

- Start development server:

```
npm run dev
```

## APIs

### Register user with name, email, phone, password

```
POST :: /api/register
```

Example Request:

```
{
	"name": "Test user 1",
	"phone": "01912000001",
	"email": "test1@exapmle.com",
	"password": "1234576"
}
```

Example Response:

```
{
  "success": true,
  "id": 6
}
```

### Login with email & password

```
POST :: /api/loginWithEmail
```

Example Request:

```
{
	"email": "test1@exapmle.com",
	"password": "1234576"
}
```

Example Response:

```
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsImlhdCI6MTU5Mzk1NDUzM30.XiNzD-fG-DJrgB64WXgyp907FFA7upIyMFR2_onY6CU"
}
```

### Login with phone & otp

- Get otp

```
POST :: /api/loginWithPhone
```

Example Request:

```
{
	"phone": "01912000003"
}
```

Example Response:

```
{
  "success": true
}
```

N.B: a OTP will be logged on server console.

- Verify otp

```
POST :: /api/validateOtp
```

Example Request:

```
{
	"phone": "01912000000",
	"otp": "1061"
}
```

Example Response:

```
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTU5Mzk1MTU5MH0.HrnaCpH5VWViHbHPVASo2ydDARtPWpLglT-1I8lExgw"
}
```

### Get User Details (after login)

```
GET :: /api/me
```

Example Response:

```
{
  "success": true,
  "user": {
    "name": "Test user 1",
    "phone": "01912000001",
    "email": "test1@exapmle.com",
    "createdAt": "2020-07-05T05:23:32.000Z"
  }
}
```

## License

[MIT](https://choosealicense.com/licenses/mit/)
