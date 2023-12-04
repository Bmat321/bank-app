import express from "express";
import jwt from "jsonwebtoken";
import {
  balance,
  deposit,
  login,
  logout,
  register,
  sendemail,
  transfer,
  withdraw,
} from "../controllers/auth.js";

// const dateTime = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);

router.put("/withdraw", (req, res) => {
  const token = req.cookies.accessToken;
  // const deposit = req.params.deposit;

  if (!token) return res.status(401).json("Not logged In");

  jwt.verify(token, "secreteKay", (err, userInfo) => {
    if (err) return res.status(403).json("Invalid token");
    withdraw(req.body, (msg) => {
      res.status(200).json(msg);
    });
  });
});

router.put("/deposit", (req, res) => {
  const token = req.cookies.accessToken;

  // const deposit = req.params.deposit;

  if (!token) return res.status(401).json("Not logged In");

  jwt.verify(token, "secreteKay", (err, userInfo) => {
    if (err) return res.status(403).json("Invalid token");
    deposit(req.body, (msg) => {
      res.status(200).json(msg);
    });
  });
});

router.put("/transfer", (req, res) => {
  const token = req.cookies.accessToken;
  // const deposit = req.params.deposit;

  if (!token) return res.status(401).json("Not logged In");

  jwt.verify(token, "secreteKay", (err, userInfo) => {
    if (err) return res.status(403).json("Invalid token");
    transfer(req.body, (msgDm, mso) => {
      if (msgDm) {
        return res.status(200).json(msgDm);
      }

      return res.status(200).json(mso);
    });
  });
});
router.get("/find/:balance", balance);

router.post("/sendEmail", async (req, res) => {
  // const { email, message, subject } = req.body;
  try {
    // const sendTo = email;
    const sendFrom = process.env.USEREMAIL;
    // const replyTo = email;
    // const subject = subject;
    // const message = message;
    await sendemail({
      ...req.body,
      // sendTo,
      sendFrom,
      // replyTo,
      // subject,
      // message,
    });
    res.status(200).json({
      success: true,
      messsage: "Email Sent",
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

export default router;
