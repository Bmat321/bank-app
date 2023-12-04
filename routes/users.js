import express from "express";
import { getUserOnly, getUsers, summary } from "../controllers/user.js";

const router = express.Router();

router.get("/", getUserOnly);
router.get("/find/:id", getUsers);

router.get("/summary", summary);

export default router;
