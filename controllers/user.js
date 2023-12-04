import jwt from "jsonwebtoken";
import { db } from "../connect.js";

export const getUserOnly = (req, res) => {
  const token = req.cookies.accessToken;
  // const { m } = req.query.m;
  const m = req.query.m;

  if (!token) return res.status(401).json("Not logged In");

  jwt.verify(token, "secreteKay", (err, userInfo) => {
    if (err) return res.status(403).json("Invalid token");

    const q = "SELECT id, fullname, account_no FROM users";
    // : "SELECT id, username, account_no FROM users";

    db.query(q, [req.query.m], async (err, data) => {
      if (err) return res.status(500).json(err);
      const keys = ["account_no", "fullname"];
      const search = (rec) => {
        return rec.filter((item) =>
          keys.some((key) => item[key].toLowerCase().includes(m))
        );
      };

      // const { password, ...others } = data;
      return res
        .status(200)
        .json(search(data.filter((other) => other.id !== userInfo.id)));
    });
  });
};

export const getUsers = (req, res) => {
  const q = "SELECT * FROM users WHERE id = ?";

  db.query(q, [req.params.id], (err, data) => {
    if (err) return res.status(500).json(err);

    const { password, ...others } = data[0];
    return res.status(200).json(others);
  });
};

export const summary = (req, res) => {
  const q = "SELECT * FROM transfer ORDER BY date_withdrawn DESC LIMIT 5";

  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};
