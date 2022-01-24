const fs = require("fs");
const { validateUser } = require("../userHelpers");
const express = require("express");
const router = express.Router();
const User = require("../models/User");
var jwt = require("jsonwebtoken");
const serverConfig = require("../serverConfig");
const { auth } = require("../middlewares/auth");
require("dotenv").config();
require("../mongoConnect");

// Post register using mongoDB
router.post("/", async (req, res, next) => {
  try {
    console.log(req.body);
    const { username, age, password } = req.body;
    const user = new User({ username, age, password });
    await user.save();
    res.send({ message: "sucess" });
  } catch (error) {
    next({ status: 422, message: error.message });
  }
});

// Post Login using mongoDB and generating token
router.post("/login", async (req, res, next) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user)
    return next({ status: 401, message: "username or password is incorrect" });
  if (user.password !== password)
    next({ status: 401, message: "username or password is incorrect" });
  const payload = { id: user.id };
  const token = jwt.sign(payload, serverConfig.secret, { expiresIn: "5d" });
  return res.status(200).send({ message: "Logged in Successfully", token });
});

// Patch edit user by id and modify the only data sent with mongoDB
router.patch("/users/:userId", auth, async (req, res, next) => {
  if (req.user.id !== req.params.userId)
    next({ status: 403, message: "Authorization error" });
  try {
    const { password, age } = req.body;
    if (password) req.user.password = password;
    if (age) req.user.age = age;
    await req.user.save();
    res.send("sucess");
  } catch (error) {
    next({ status: 500, internalMessage: error.message });
  }
});

// Get with age filter and return all users if no age is sent with mongoDB
router.get("/", auth, async (req, res, next) => {
  try {
    const query = req.query.age ? { age: req.query.age } : {};
    const users = await User.find(query, { username: 1, age: 1, _id: 0 });
    res.send(users);
  } catch (error) {
    next({ status: 500, internalMessage: error.message });
  }
});

// Get user by id
router.get("/:id", auth, async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    const users = await User.find(query, { username: 1, age: 1, _id: 0 });
    res.status(200).send(users);
  } catch (error) {
    next({ status: 500, internalMessage: error.message });
  }
});

// Delete user by id
router.delete("/:id", auth, async (req, res, next) => {
  try {
    if (req.user.id !== req.params.userId)
      next({ status: 403, message: "Authorization error" });
    await User.findByIdAndDelete(req.user.id);
    res.status(200).send({ message: "user deleted" });
  } catch (error) {
    next({ status: 500, internalMessage: error.message });
  }
});

module.exports = router;
