import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import moment from "moment/moment.js";
import { db } from "../connect.js";
import nodemailer from "nodemailer";

let dateTime = moment(new Date()).local().format("YYYY-MM-DD HH:mm:ss");
export const register = (req, res) => {
  // moment(Date.now()).format("dddd, MMMM Do YYYY, h:mm:ss a");
  // CHECK IF USER EXIST
  // const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000);
  // const accountNumber = Math.floor(
  //   Math.pow(10, 8 - 1) +
  //     Math.random() * (Math.pow(10, 8) - Math.pow(10, 8 - 1) - 1)
  // );
  const accountNumber = Math.random().toString().substr(2, 8);

  const q = "SELECT * FROM users WHERE username = ?";

  db.query(q, [req.body.username], async (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length) return res.status(509).json("User alreay exists");
    // CREATE NEW USER
    // HASH PASSWORD

    const salt = bcrypt.genSaltSync(10);
    const hashPassword = bcrypt.hashSync(req.body.password, salt);

    const q =
      "INSERT INTO users(`username`, `email`,`password`, `fullname`, `balance`, account_no ) VALUE(?)";

    const values = [
      req.body.username,
      req.body.email,
      hashPassword,
      req.body.fullname,
      (req.body.balance = 0),
      (req.body.account_no = accountNumber),
    ];

    db.query(q, [values], (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(201).json("User has been created");
    });
  });
};

export const login = (req, res) => {
  const q = "SELECT * FROM users WHERE username = ?";

  db.query(q, [req.body.username], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length === 0) return res.status(404).json("User not found");

    const checkPassword = bcrypt.compareSync(
      req.body.password,
      data[0].password
    );
    if (!checkPassword)
      return res.status(400).json("Wrong password or username");

    const token = jwt.sign({ id: data[0].id }, "secreteKay", {
      expiresIn: "7d",
    });

    const { password, ...others } = data[0];

    return res
      .cookie("accessToken", token, {
        httpOnly: true,
      })
      .status(201)
      .json({ ...others, token, isLoggedIn: true });

    // return res
    //   .cookie("accessToken", token, {
    //     httpOnly: true,
    //   })
    //   .status(201)
    //   .json(others);
  });
};

export const logout = (req, res) => {
  return res
    .clearCookie("accessToken", {
      secure: true,
      sameSite: "none",
    })
    .status(200)
    .json("User logged out");
};

export const deposit = ({ account_no, amount }, onDeposit = undefined) => {
  const q = "SELECT balance FROM users WHERE account_no = ?";

  db.query(q, [account_no], async (err, data) => {
    if (err) {
      console.log("Problem in withdraw");
    }
    if (data) {
      const balance = parseFloat(data[0].balance);
      const newBalance = balance + amount;

      const q = "UPDATE users SET `balance`=? WHERE account_no=? ";

      if (amount < 0) {
        return;
      }
      db.query(q, [newBalance, account_no], (err, data1) => {
        if (err) console.log("You cant withdraw");
        if (data1) {
          const q =
            "UPDATE users SET `deposit` =?, `date_deposited`= ? WHERE account_no=?";

          db.query(q, [amount, dateTime, account_no], (_) => {});

          if (onDeposit) onDeposit(`Amount ${amount} deposit successfully`);
        }
      });
    }
  });
};

export const withdraw = ({ account_no, amount }, onWithdraw = undefined) => {
  const q = "SELECT balance FROM users WHERE account_no = ?";

  db.query(q, [account_no], async (err, data) => {
    if (err) {
      console.log("Problem in withdraw");
    }
    if (data) {
      const balance = parseFloat(data[0]?.balance);
      const newBalance = balance - amount;

      const q = "UPDATE users SET `balance`=? WHERE account_no=? ";

      if (balance <= amount || amount <= 0) {
        return;
      }
      db.query(q, [newBalance, account_no], (err, data) => {
        if (err) console.log("You cant withdraw");
        if (data) {
          const q =
            "UPDATE users SET `withdraw` =?, `date_withdrawn`= ? WHERE account_no=?";

          db.query(q, [amount, dateTime, account_no], (_) => {});
          if (onWithdraw) onWithdraw(`Amount ${amount} withdrawn successfully`);
        }
      });
    }
  });
};

export const transfer = async (
  { scrId, destId, amount },
  onTransfers = undefined,
  onTransfer = undefined
) => {
  withdraw({ account_no: scrId, amount }, () => {
    deposit({ account_no: destId, amount }, () => {
      const q =
        "SELECT id, fullname, date_deposited, deposit FROM users WHERE account_no = ?";
      db.query(q, [destId], (err, data) => {
        if (err) console.log(`No ${destId} found`);
        if (onTransfers)
          onTransfers(
            data.map((item) => {
              return item;
            })
          );
        const beneficiary = Object.fromEntries(
          Object.entries(data).map(([key, val]) => [key, val])
        );

        const q =
          "INSERT INTO transfer (`transfer_amount`, `fullname`, `date_withdrawn`, `account_id`) VALUES (?)";

        const values = [
          beneficiary[0].deposit,
          beneficiary[0].fullname,
          beneficiary[0].date_deposited,

          beneficiary[0].id,
        ];

        db.query(q, [values], (err, data1) => {});
      });
    });
  });
  if (onTransfer) onTransfer(`Amount ${amount}  transfer successfully`);
};

export const balance = (req, res) => {
  const balance = req.params.balance;
  const q = "SELECT balance FROM users WHERE id = ?";

  db.query(q, [balance], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data) {
      const { balance } = data[0];
      return res.status(200).json(`Your balance is ${balance} `);
    }
  });
};

export const sendemail = async ({
  sendTo,
  sendFrom,
  replyTo,
  subject,
  message,
}) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAILHOST,
    port: "587",
    auth: {
      user: process.env.USEREMAIL,
      pass: process.env.PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
  const options = {
    to: sendTo,
    from: sendFrom,
    replyTo,
    subject,
    html: message,
  };

  // SEND EMAIL
  transporter.sendMail(options, (err, info) => {
    if (err) {
      console.log(err);
    } else {
      console.log(info);

      // if (onSendEmail) onSendEmail(`Message send successfully`);
    }
  });
};
