/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import express from "express";
import { findUserByUsername, newUser } from "./db";
import * as t from "./types";

const router = express.Router();

router.use(function(req: express.Request, res: express.Response): void {
  if (req.user.isRoot) {
    return req.next();
  }
  res.status(403).send("Not enough permission.");
});

/**
 * Create a new user in database.
 * Response codes:
 *  * 200: OK
 *  * 404: User with same national code (username) already
 *         exists.
 */
router.post("/users/new", async function(
  req: express.Request,
  res: express.Response
): Promise<void> {
  const user: t.User = {
    uid: req.body.nationalCode,
    name: req.body.name,
    lastName: req.body.lastName
  };
  const check = await findUserByUsername(user.uid);
  if (check) {
    return void res.send({
      code: 404
    });
  }
  await newUser(user, req.body.password);
  res.send({
    code: 200
  });
});

export { router };
