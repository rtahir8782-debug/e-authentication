const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const app = express();

app.use(cors());

// Route to auth service
app.use("/auth", createProxyMiddleware({
  target: "http://auth-service:4001",
  changeOrigin: true,
  pathRewrite: { "^/auth": "" }
}));

// Route to user service
app.use("/users", createProxyMiddleware({
  target: "http://user-service:4002",
  changeOrigin: true
}));

app.listen(4000, () => {
  console.log("API Gateway running on 4000");
});