export default () => ({
  port: process.env.PORT,
  database: {
    host: process.env.DATABASE_URL,
  },
  access: {
    accessTokenKey: process.env.ACCESS_TOKEN_KEY,
    accessTokenExpireTime: process.env.ACCESS_TOKEN_EXPIRE_TIME,
  },
  // refresh: {
  //   refreshTokenKey: process.env.REFRESH_TOKEN_KEY,
  //   refreshTokenExpireTime: process.env.REFRESH_TOKEN_EXPIRE_TIME,
  // },
});
  