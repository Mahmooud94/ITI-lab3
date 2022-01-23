const fs = require("fs");
const { validateUser } = require("../userHelpers");
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

// user register

router.post("/", validateUser, async (req, res, next) => {
  try {
    const { username, age, password } = req.body;
    const data = await fs.promises
      .readFile("./user.json", { encoding: "utf8" })
      .then((data) => JSON.parse(data));
    const id = uuidv4();
    data.push({ id, username, age, password });
    await fs.promises.writeFile("./user.json", JSON.stringify(data), {
      encoding: "utf8",
    });
    res.send({ id, message: "sent sucess" });
  } catch (error) {
    next({ status: 403, internalMessage: error.message });
  }
});

// user login

router.post("/login", validateUser, (req, res) => {
  res.status(401).send({ error: "failed" });
});

// user editing

router.patch("/:userId", validateUser, async (req, res, next) => {
  try {
    const { username, password, age } = req.body;
    const users = await fs.promises
      .readFile("./user.json", { encoding: "utf8" })
      .then((data) => JSON.parse(data));

    const newUsers = users.map((user) => {
      if (user.id !== req.params.userId) return user;
      return {
        username,
        age,
        password,
        id: req.params.userId,
      };
    });
    await fs.promises.writeFile("./user.json", JSON.stringify(newUsers), {
      encoding: "utf8",
    });
    res.status(200).send({ message: "user modified" });
  } catch (error) {
    next({ status: 404, internalMessage: error.message });
  }
});

//  getting user by id

router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    console.log(id);
    const users = await fs.promises
      .readFile("./user.json", { encoding: "utf8" })
      .then((data) => JSON.parse(data));

    const newUser = users.filter((user) => {
      return user.id == id;
    });
    res.status(200).send(newUser);
  } catch (error) {
    next({ status: 500, internalMessage: error.message });
  }
});

// getting users by age else sending all users if age not matched

router.get("/", async (req, res, next) => {
  try {
    const age = Number(req.query.age);
    const users = await fs.promises
      .readFile("./user.json", { encoding: "utf8" })
      .then((data) => JSON.parse(data));
    if (!age) {
      return res.send(users);
    }
    const filteredUsers = users.filter((user) => user.age === age);
    res.send(filteredUsers);
  } catch (error) {
    next({ status: 500, internalMessage: error.message });
  }
});

// deleting user by id

router.delete("/:userId", async (req, res, next) => {
  try {
    const id = req.params.id;
    console.log(id);
    const users = await fs.promises
      .readFile("./user.json", { encoding: "utf8" })
      .then((data) => JSON.parse(data));

    const newUsers = users.filter((user) => {
      return user.id !== id;
    });
    await fs.promises.writeFile(
      "./user.json",
      JSON.stringify(newUsers),
      (err) => {
        if (!err) return res.status(200).send({ message: "success" });
        res.status(500).send("server error");
      }
    );
    res.status(200).send({ message: "user deleted" });
  } catch (error) {
    next({ status: 500, internalMessage: error.message });
  }
});

// middelware

router.use((err, req, res, next) => {
  if (err.status >= 500) {
    return res.status(500).send({ error: "internal server error" });
  } else if (err.status >= 400 && err.status < 500) {
    return res.status(400).send({ error: "can't reache server" });
  }
});

module.exports = router;
