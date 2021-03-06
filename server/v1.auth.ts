/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import express from "express";
import { login, LOGIN_ERR_CODE } from "./auth";
import * as db from "./db";
import { PARSE_ERR_CODE, parseToken } from "./token";

const router = express.Router();

/**
 * TODO(qti3e) Add rate limit to this endpoint.
 * Response codes:
 *   400: Not enough data.
 *   404: User does not exists.
 *   403: Wrong password.
 *   200: OK (data.token is available).
 */
router.post("/login", async function(
  req: express.Request,
  res: express.Response
): Promise<void> {
  const { username, password } = req.body;
  if (!username || !password) {
    return void res.send({
      code: 400
    });
  }
  const token = await login(username, password);
  if (token === LOGIN_ERR_CODE.NOT_FOUND) {
    return void res.send({
      code: 404
    });
  }
  if (token === LOGIN_ERR_CODE.WRONG_PASSWORD) {
    return void res.send({
      code: 403
    });
  }
  res.send({
    code: 200,
    token
  });
});

/**
 * Status code 555 means token is expired.
 */
export async function requestToken(
  req: express.Request,
  res: express.Response
): Promise<void> {
  const token = req.get("hod-token");
  const uid = token && parseToken(token);

  if (uid === PARSE_ERR_CODE.INVALID) {
    return void res.status(403);
  } else if (uid === PARSE_ERR_CODE.EXPIRED) {
    return void res.send({
      code: 555
    });
  }

  req.user = await db.getUser(uid);

  req.next();
}

router.use(requestToken);

router.post("/me", async function(
  req: express.Request,
  res: express.Response
): Promise<void> {
  res.send(req.user);
});

export { router };
