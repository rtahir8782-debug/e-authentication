const express = require("express");
const app = express();

app.get("/users", (req, res) => {
  res.json([{ id: 1, name: "Test User" }]);
});

app.listen(4002, () => console.log("User Service running on 4002"));